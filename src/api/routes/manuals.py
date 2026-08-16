import os
import threading
import requests
import cloudinary
import cloudinary.uploader
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Manual, ManualMetadata, ChatHistory, Project
from api.pdf_processor import extraer_y_trocear_pdf
from api.groq_service import send_message as groq_send

manuals_bp = Blueprint('manuals', __name__)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)


def generar_respuesta_manual(project_id, nombre_manual, app):
    """
    genera la respuesta automática de gia tras procesar el pdf.
    usa el inventario estructurado si está disponible.
    maneja correctamente el caso de metadata o inventario None.
    """
    with app.app_context():
        try:
            # espero a que el manual esté listo
            manual = Manual.query.filter_by(
                project_id=project_id,
                status="listo"
            ).order_by(Manual.created_at.desc()).first()

            if not manual:
                print(f"=== MANUAL RESPONSE: manual no encontrado para project {project_id} ===")
                return

            metadata = ManualMetadata.query.filter_by(manual_id=manual.id).first()

            # construyo el resumen del manual para GIA
            partes_resumen = [f"Acabo de procesar el manual '{nombre_manual}'."]

            if metadata:
                if metadata.total_steps:
                    partes_resumen.append(f"Tiene {metadata.total_steps} pasos.")
                if metadata.estimated_time:
                    partes_resumen.append(f"Tiempo estimado: {metadata.estimated_time} minutos.")
                if metadata.difficulty:
                    partes_resumen.append(f"Dificultad: {metadata.difficulty}.")
                if metadata.tools_required:
                    tools = ", ".join(metadata.tools_required[:4])
                    partes_resumen.append(f"Herramientas necesarias: {tools}.")

                # añado info del inventario si está disponible
                if metadata.components_inventory:
                    inv = metadata.components_inventory
                    herrajes_confirmados = [
                        h for h in inv.get("herrajes", [])
                        if "confirmado" in h.get("confianza", "")
                    ]
                    piezas_confirmadas = [
                        p for p in inv.get("piezas", [])
                        if "confirmado" in p.get("confianza", "")
                    ]
                    if piezas_confirmadas:
                        partes_resumen.append(f"He identificado {len(piezas_confirmadas)} piezas.")
                    if herrajes_confirmados:
                        partes_resumen.append(f"He identificado {len(herrajes_confirmados)} tipos de herrajes.")
                    no_confirmados = inv.get("no_confirmados", [])
                    if no_confirmados:
                        partes_resumen.append(f"Hay {len(no_confirmados)} componentes que necesito que me confirmes durante el montaje.")

            resumen = " ".join(partes_resumen)

            # contexto del inventario para groq
            contexto_inventario = None
            if metadata and metadata.components_inventory:
                inv = metadata.components_inventory
                lineas = ["INVENTARIO DEL PRODUCTO:"]
                herrajes_confirmados = [
                    h for h in inv.get("herrajes", [])
                    if "confirmado" in h.get("confianza", "")
                ]
                for h in herrajes_confirmados:
                    linea = f"  {h['letra']} = {h.get('tipo', 'componente')} × {h.get('cantidad', '?')}"
                    lineas.append(linea)
                piezas_confirmadas = [
                    p for p in inv.get("piezas", [])
                    if "confirmado" in p.get("confianza", "")
                ]
                for p in piezas_confirmadas:
                    linea = f"  Pieza {p['id']}: {p.get('descripcion', '')} × {p.get('cantidad', '?')}"
                    lineas.append(linea)
                if len(lineas) > 1:
                    contexto_inventario = "\n".join(lineas)

            # mensaje a groq
            historial = [{"role": "user", "content": resumen}]

            resultado = groq_send(
                messages=historial,
                context=None,
                manual_info=contexto_inventario,
                is_first_message=False,
                nivel_asistencia=None
            )

            gia_response = resultado.get("response", "").replace("**", "")
            tokens_used = resultado.get("tokens_used", 0)

            if not gia_response:
                gia_response = f"He procesado el manual '{nombre_manual}'. ¿Empezamos?"

            # guardo la respuesta en chathistory
            chat_entry = ChatHistory(
                project_id=project_id,
                user_message=f"[Manual procesado: {nombre_manual}]",
                gia_response=gia_response,
                chunks_used=[],
                tokens_used=tokens_used
            )
            db.session.add(chat_entry)
            db.session.commit()
            print(f"=== MANUAL RESPONSE: respuesta guardada para project {project_id} ===")

        except Exception as e:
            print(f"=== MANUAL RESPONSE: error — {e} ===")
            import traceback
            traceback.print_exc()


def procesar_manual_en_hilo(pdf_content, manual_id, project_id, nombre_manual, app):
    """
    procesa el pdf en segundo plano y después genera la respuesta de gia.
    """
    with app.app_context():
        try:
            extraer_y_trocear_pdf(pdf_content, manual_id)
            print(f"=== HILO: pdf procesado correctamente — generando respuesta ===")
            generar_respuesta_manual(project_id, nombre_manual, app)
        except Exception as e:
            print(f"=== HILO: error procesando pdf — {e} ===")
            import traceback
            traceback.print_exc()


@manuals_bp.route('/<int:project_id>/upload', methods=['POST'])
@jwt_required()
def upload_manual(project_id):
    """
    recibe un pdf, lo sube a cloudinary y lanza el procesamiento en segundo plano.
    devuelve respuesta inmediata al frontend mientras el pdf se procesa.
    """
    user_id = int(get_jwt_identity())

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "proyecto no encontrado"}), 404
    if project.user_id != user_id:
        return jsonify({"error": "no tienes permiso"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "no se recibió ningún archivo"}), 400

    archivo = request.files['file']
    if not archivo.filename or not archivo.filename.lower().endswith('.pdf'):
        return jsonify({"error": "solo se aceptan archivos pdf"}), 400

    try:
        pdf_content = archivo.read()
        nombre_manual = archivo.filename

        # subo a cloudinary
        upload_response = cloudinary.uploader.upload(
            pdf_content,
            resource_type="raw",
            folder=f"gia/project_{project_id}/manuals",
            public_id=nombre_manual.replace(".pdf", ""),
            overwrite=True
        )
        file_url = upload_response['secure_url']
        print(f"=== MANUAL: subido a cloudinary → {file_url} ===")

        # creo registro en bd
        manual = Manual(
            project_id=project_id,
            file_url=file_url,
            original_filename=nombre_manual,
            status="procesando",
            total_chunks=0
        )
        db.session.add(manual)
        db.session.commit()

        # lanzo procesamiento en hilo separado
        from flask import current_app
        app = current_app._get_current_object()

        hilo = threading.Thread(
            target=procesar_manual_en_hilo,
            args=(pdf_content, manual.id, project_id, nombre_manual, app)
        )
        hilo.daemon = True
        hilo.start()

        return jsonify({
            "message": "manual recibido y procesándose",
            "manual_id": manual.id,
            "status": "procesando"
        }), 202

    except Exception as e:
        print(f"=== MANUAL: error subiendo — {e} ===")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "error procesando el manual"}), 500