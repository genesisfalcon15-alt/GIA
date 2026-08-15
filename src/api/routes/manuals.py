import cloudinary
import cloudinary.uploader
import os
import requests as req
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, Manual, ManualMetadata, ChatHistory
from api.utils import APIException
from api.pdf_processor import extraer_y_trocear_pdf

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

manuals_bp = Blueprint('manuals', __name__)


def generar_respuesta_manual(project, manual):
    """
    genera una respuesta corta y con personalidad de GIA tras procesar el manual.
    usa la metadata extraída del PDF — nunca el nombre del archivo.
    """
    try:
        metadata = ManualMetadata.query.filter_by(manual_id=manual.id).first()

        info = []
        if metadata:
            if metadata.total_steps:
                info.append(f"Pasos totales: {metadata.total_steps}.")
            if metadata.estimated_time:
                info.append(f"Tiempo estimado: {metadata.estimated_time} minutos.")
            if metadata.difficulty:
                info.append(f"Dificultad: {metadata.difficulty}.")
            if metadata.tools_required:
                herramientas = ", ".join(metadata.tools_required[:4])
                info.append(f"Herramientas necesarias: {herramientas}.")
            if metadata.parts_list:
                info.append(f"El manual incluye lista de piezas detallada.")

        contexto_manual = "\n".join(info) if info else "Manual procesado y listo."

        prompt_sistema = f"""Eres GIA, una asistente cercana y experta en montaje.
Acabas de leer el manual de montaje de un producto.

Lo que sabes del manual:
{contexto_manual}

Responde como lo haría un amigo experto que acaba de echarle un vistazo rápido al manual.
Algo así como: "Bien, lo tengo. Son X pasos, necesitas Y y Z. No es complicado, unos 60 minutos. ¿Arrancamos?"
Varía el tono — natural, directo, con energía positiva.
Sin mencionar el archivo. Sin mencionar la marca si no la sabes.
Máximo 2 frases. Sin asteriscos. Sin listas."""

        response = req.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": prompt_sistema},
                    {"role": "user", "content": "Acabo de subir el manual. ¿Qué tienes?"}
                ],
                "temperature": 0.8,
                "max_tokens": 120
            },
            timeout=15
        )

        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"].replace("**", "")

    except Exception as e:
        print(f"=== MANUAL: error generando respuesta automática — {e} ===")

    return "Manual listo. Ya tengo todo lo que necesito. ¿Empezamos?"


@manuals_bp.route('/<int:project_id>/upload', methods=['POST'])
@jwt_required()
def upload_manual(project_id):
    """
    sube un pdf a un proyecto.
    si ya existe un manual lo reemplaza.
    después de procesar genera una respuesta automática de GIA.
    """
    user_id = int(get_jwt_identity())

    project = Project.query.get(project_id)
    if not project:
        raise APIException("proyecto no encontrado", status_code=404)
    if project.user_id != user_id:
        raise APIException("no tienes permiso para este proyecto", status_code=403)

    if 'file' not in request.files:
        raise APIException("no me llegó ningún archivo", status_code=400)

    file = request.files['file']
    if file.filename == '':
        raise APIException("el archivo está vacío", status_code=400)

    if not file.filename.lower().endswith('.pdf'):
        raise APIException("solo se aceptan archivos pdf", status_code=400)

    file_content = file.read()
    if not file_content.startswith(b'%PDF'):
        raise APIException("el archivo no es un pdf válido", status_code=400)

    manual_existente = Manual.query.filter_by(project_id=project_id).first()
    if manual_existente:
        db.session.delete(manual_existente)
        db.session.commit()
        print(f"=== MANUAL: eliminado manual anterior del proyecto {project_id} ===")

    try:
        upload_response = cloudinary.uploader.upload(
            file_content,
            resource_type="raw",
            folder=f"gia/project_{project_id}",
            public_id=file.filename.replace('.pdf', '')
        )
        file_url = upload_response['secure_url']
    except Exception as err:
        import traceback
        traceback.print_exc()
        raise APIException(f"error subiendo a cloudinary: {str(err)}", status_code=500)

    manual = Manual(
        project_id=project_id,
        file_url=file_url,
        original_filename=file.filename,
        status="procesando",
        total_chunks=0
    )
    db.session.add(manual)
    db.session.commit()

    extraer_y_trocear_pdf(file_content, manual.id)

    gia_response = generar_respuesta_manual(project, manual)

    chat_entry = ChatHistory(
        project_id=project_id,
        user_message=f"[manual subido: {file.filename}]",
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=0
    )
    db.session.add(chat_entry)
    db.session.commit()

    print(f"=== MANUAL: respuesta automática generada para proyecto {project_id} ===")

    return jsonify({
        "message": "archivo recibido, procesando...",
        "manual_id": manual.id,
        "status": manual.status,
        "gia_response": gia_response
    }), 202