import cloudinary
import cloudinary.uploader
import os
import re
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, ChatHistory, ProjectTimeline, ProjectPhoto
from api.utils import APIException
from api.groq_service import send_message as groq_send
from api.image_service import analyze_image
from api.conversation_context_service import (
    construir_contexto_conversacion,
    construir_info_manual_para_groq
)

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

chat_bp = Blueprint('chat', __name__)


def registrar_timeline(project_id, evento, tipo="info"):
    """añade un evento al timeline del proyecto de forma segura"""
    try:
        entry = ProjectTimeline(
            project_id=project_id,
            evento=evento,
            tipo=tipo
        )
        db.session.add(entry)
    except Exception as e:
        print(f"=== TIMELINE: error registrando evento — {e} ===")


def detectar_nivel_en_respuesta(user_message):
    """detecta si el usuario indica su nivel de asistencia en el mensaje"""
    msg = user_message.lower()
    if any(p in msg for p in ["paso a paso", "con detalle", "no sé", "principiante", "despacio", "nunca he"]):
        return "principiante"
    if any(p in msg for p in ["normal", "a ritmo normal", "intermedio"]):
        return "intermedio"
    if any(p in msg for p in ["directo", "rápido", "experto", "lo llevo yo", "sin explicaciones", "tengo experiencia"]):
        return "experto"
    return None


def construir_contexto_vision(project):
    """
    construye el contexto completo del proyecto para vision.
    incluye título, estado, paso actual y los últimos mensajes de la conversación.
    """
    partes = []

    if project.title:
        partes.append(f"Proyecto: {project.title}")
    if project.status:
        partes.append(f"Estado: {project.status}")

    extra = project.extra_data or {}
    paso_actual = extra.get("current_step")
    total_pasos = extra.get("total_steps")
    if paso_actual and total_pasos:
        partes.append(f"Paso actual: {paso_actual} de {total_pasos}")

    nivel = extra.get("nivel_asistencia")
    if nivel:
        partes.append(f"Nivel de asistencia: {nivel}")

    ultimos = ChatHistory.query.filter_by(
        project_id=project.id
    ).order_by(ChatHistory.created_at.desc()).limit(4).all()

    if ultimos:
        partes.append("\nConversación reciente:")
        for entrada in reversed(ultimos):
            partes.append(f"Usuario: {entrada.user_message}")
            if entrada.gia_response:
                resumen = entrada.gia_response[:150]
                if len(entrada.gia_response) > 150:
                    resumen += "..."
                partes.append(f"GIA: {resumen}")

    return "\n".join(partes) if partes else None


@chat_bp.route('', methods=['POST'])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())

    body = request.get_json(silent=True)
    if not body or not body.get("message"):
        raise APIException("necesito un mensaje", status_code=400)

    user_message = body.get("message")
    conversation_id = body.get("conversation_id")

    current_time = body.get("current_time", "")
    if current_time:
        user_message_con_hora = f"[Hora actual: {current_time}] {user_message}"
    else:
        user_message_con_hora = user_message

    if conversation_id is None:
        project = Project(
            user_id=user_id,
            title=None,
            status="en_progreso"
        )
        db.session.add(project)
        db.session.flush()
        es_primer_mensaje = True
    else:
        project = Project.query.get(conversation_id)
        if not project:
            raise APIException("conversacion no encontrada", status_code=404)
        if project.user_id != user_id:
            raise APIException("no tienes permiso para esta conversacion", status_code=403)
        es_primer_mensaje = len(project.chat_history) == 0

    nivel_detectado = detectar_nivel_en_respuesta(user_message)
    if nivel_detectado:
        extra = project.extra_data or {}
        extra["nivel_asistencia"] = nivel_detectado
        project.extra_data = extra
        print(f"=== CHAT: nivel de asistencia guardado → {nivel_detectado} ===")

    historial = []
    ultimos_mensajes = ChatHistory.query.filter_by(
        project_id=project.id
    ).order_by(ChatHistory.created_at.asc()).limit(8).all()

    for entrada in ultimos_mensajes:
        historial.append({"role": "user", "content": entrada.user_message})
        historial.append({"role": "assistant", "content": entrada.gia_response})

    historial.append({"role": "user", "content": user_message_con_hora})

    contexto = construir_contexto_conversacion(
        project_id=project.id,
        user_message=user_message,
        historial_groq=historial,
        user_id=user_id
    )

    info_manual = construir_info_manual_para_groq(contexto)
    nivel_asistencia = contexto.get("nivel_asistencia") or (project.extra_data or {}).get("nivel_asistencia")

    resultado = groq_send(
        messages=historial,
        context=contexto["contexto_rag"],
        manual_info=info_manual,
        is_first_message=es_primer_mensaje,
        nivel_asistencia=nivel_asistencia
    )

    gia_response = resultado["response"]
    tokens_used = resultado["tokens_used"]

    if es_primer_mensaje and resultado.get("title"):
        project.title = resultado["title"]
        registrar_timeline(
            project.id,
            f"Proyecto iniciado: {project.title}",
            tipo="hito"
        )

    chat_entry = ChatHistory(
        project_id=project.id,
        user_message=user_message,
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=tokens_used
    )
    db.session.add(chat_entry)

    match_paso = re.search(r'paso\s+(\d+)\s+de\s+(\d+)', gia_response, re.IGNORECASE)
    if match_paso:
        paso_actual = match_paso.group(1)
        total_pasos = match_paso.group(2)
        registrar_timeline(
            project.id,
            f"Paso {paso_actual} de {total_pasos}",
            tipo="montaje"
        )
        extra = project.extra_data or {}
        extra["current_step"] = int(paso_actual)
        extra["total_steps"] = int(total_pasos)
        project.extra_data = extra
        project.progress = round((int(paso_actual) / int(total_pasos)) * 100)

    if re.search(r'completado|finalizado|terminado|montaje completo|listo para usar', gia_response, re.IGNORECASE):
        registrar_timeline(
            project.id,
            "Proyecto marcado como completado por GIA",
            tipo="completado"
        )
        if project.manuals and project.category != 'guia':
            project.category = 'guia'
            project.status = 'completado'
            registrar_timeline(
                project.id,
                "Proyecto convertido en guía técnica automáticamente",
                tipo="hito"
            )
            print(f"=== PROYECTO {project.id}: convertido en guía automáticamente ===")

    db.session.commit()

    return jsonify({
        "conversation_id": project.id,
        "message": {
            "role": "assistant",
            "content": gia_response,
            "created_at": chat_entry.created_at.isoformat()
        },
        "title": project.title
    }), 200


@chat_bp.route('/image', methods=['POST'])
@jwt_required()
def send_image():
    user_id = int(get_jwt_identity())

    if 'image' not in request.files:
        raise APIException("no me llegó ninguna imagen", status_code=400)

    file = request.files['image']
    if file.filename == '':
        raise APIException("el archivo está vacío", status_code=400)

    extensiones_validas = ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif')
    if file.filename and not file.filename.lower().endswith(extensiones_validas):
        raise APIException("formato no válido — usa jpg, png o webp", status_code=400)

    conversation_id = request.form.get("conversation_id")

    if conversation_id:
        project = Project.query.get(int(conversation_id))
        if not project:
            raise APIException("conversacion no encontrada", status_code=404)
        if project.user_id != user_id:
            raise APIException("no tienes permiso para esta conversacion", status_code=403)
    else:
        project = Project(
            user_id=user_id,
            title=None,
            status="en_progreso"
        )
        db.session.add(project)
        db.session.flush()

    try:
        file_content = file.read()
        upload_response = cloudinary.uploader.upload(
            file_content,
            resource_type="image",
            folder=f"gia/project_{project.id}/images"
        )
        image_url = upload_response['secure_url']
        print(f"=== IMAGEN: subida a cloudinary → {image_url} ===")

        # protección básica contra duplicados
        foto_existente = ProjectPhoto.query.filter_by(
            project_id=project.id,
            url=image_url
        ).first()

        if foto_existente:
            print(f"=== VISION: imagen duplicada detectada ===")
            entrada_anterior = ChatHistory.query.filter_by(
                project_id=project.id,
                user_message="[imagen enviada para análisis]"
            ).order_by(ChatHistory.created_at.desc()).first()
            gia_response = entrada_anterior.gia_response if entrada_anterior else "Ya analicé esta imagen antes. ¿Tienes alguna pregunta?"
            tokens_reales = 0
            db.session.add(ChatHistory(
                project_id=project.id,
                user_message="[imagen enviada para análisis]",
                gia_response=gia_response,
                chunks_used=[],
                tokens_used=0
            ))
            db.session.commit()
            return jsonify({
                "conversation_id": project.id,
                "message": {
                    "role": "assistant",
                    "content": gia_response,
                    "created_at": db.func.now()
                },
                "title": project.title
            }), 200

        # guardo la foto en ProjectPhoto
        foto_proyecto = ProjectPhoto(
            project_id=project.id,
            url=image_url,
            caption="Foto enviada en chat"
        )
        db.session.add(foto_proyecto)

        # construyo contexto para vision
        project_context = construir_contexto_vision(project)

        # paso 1 — vision analiza la imagen
        resultado_vision = analyze_image(
            image_url=image_url,
            project_context=project_context
        )
        analisis_vision = resultado_vision["analysis"]
        tokens_vision = resultado_vision.get("tokens_used", 0)
        print(f"=== VISION: análisis obtenido — {tokens_vision} tokens ===")

        # paso 2 — groq recibe el análisis de vision como contexto interno
        # recupero el historial igual que en send_message
        historial = []
        ultimos_mensajes = ChatHistory.query.filter_by(
            project_id=project.id
        ).order_by(ChatHistory.created_at.asc()).limit(8).all()

        for entrada in ultimos_mensajes:
            historial.append({"role": "user", "content": entrada.user_message})
            historial.append({"role": "assistant", "content": entrada.gia_response})

        # añado el análisis de vision como contexto interno — no como mensaje del usuario
        # uso el rol system via manual_info para que groq lo trate como información de contexto
        contexto = construir_contexto_conversacion(
            project_id=project.id,
            user_message="[imagen enviada]",
            historial_groq=historial,
            user_id=user_id
        )

        info_manual = construir_info_manual_para_groq(contexto)
        nivel_asistencia = (project.extra_data or {}).get("nivel_asistencia")

        # construyo el contexto visual como información adicional para groq
        contexto_visual = f"\n\n# ANÁLISIS VISUAL DE LA FOTOGRAFÍA ENVIADA\n{analisis_vision}\nUsa esta información visual junto con el contexto de la conversación para responder como GIA. No repitas el análisis literalmente — interprétalo y úsalo para ayudar al usuario."

        info_con_vision = (info_manual or "") + contexto_visual

        # groq genera la respuesta final
        resultado_groq = groq_send(
            messages=historial,
            context=contexto["contexto_rag"],
            manual_info=info_con_vision,
            is_first_message=False,
            nivel_asistencia=nivel_asistencia
        )

        gia_response = resultado_groq["response"]
        tokens_groq = resultado_groq.get("tokens_used", 0)
        tokens_reales = tokens_vision + tokens_groq
        print(f"=== CHAT/IMAGE: tokens vision={tokens_vision} groq={tokens_groq} total={tokens_reales} ===")

    except Exception as err:
        raise APIException(f"error procesando imagen: {str(err)}", status_code=500)

    es_primera = len(project.chat_history) == 0
    if es_primera and not project.title:
        project.title = "Análisis de imagen"

    registrar_timeline(
        project.id,
        "Fotografía enviada para análisis visual",
        tipo="info"
    )

    # guardo la respuesta final de groq — no la de vision
    chat_entry = ChatHistory(
        project_id=project.id,
        user_message="[imagen enviada para análisis]",
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=tokens_reales
    )

    db.session.add(chat_entry)
    db.session.commit()

    return jsonify({
        "conversation_id": project.id,
        "message": {
            "role": "assistant",
            "content": gia_response,
            "created_at": chat_entry.created_at.isoformat()
        },
        "title": project.title
    }), 200