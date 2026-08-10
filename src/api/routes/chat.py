import cloudinary
import cloudinary.uploader
import os
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


@chat_bp.route('', methods=['POST'])
@jwt_required()
def send_message():
    """
    endpoint principal de gia.
    orquesta el flujo: obtiene contexto → llama a groq → guarda respuesta
    """
    user_id = int(get_jwt_identity())

    body = request.get_json(silent=True)
    if not body or not body.get("message"):
        raise APIException("necesito un mensaje", status_code=400)

    user_message = body.get("message")
    conversation_id = body.get("conversation_id")

    # incluyo la hora actual en el mensaje para que gia pueda responderla
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

    historial = []
    ultimos_mensajes = ChatHistory.query.filter_by(
        project_id=project.id
    ).order_by(ChatHistory.created_at.asc()).limit(20).all()

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

    resultado = groq_send(
        messages=historial,
        context=contexto["contexto_rag"],
        manual_info=info_manual,
        is_first_message=es_primer_mensaje
    )

    gia_response = resultado["response"]
    tokens_used = resultado["tokens_used"]

    if es_primer_mensaje and resultado.get("title"):
        project.title = resultado["title"]
        # registro inicio del proyecto en el timeline
        registrar_timeline(
            project.id,
            f"Proyecto iniciado: {project.title}",
            tipo="hito"
        )

    # guardo el mensaje original sin la hora en el historial
    chat_entry = ChatHistory(
        project_id=project.id,
        user_message=user_message,
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=tokens_used
    )

    db.session.add(chat_entry)

    # detecto si gia menciona un paso y lo registro en el timeline
    import re
    match_paso = re.search(r'paso\s+(\d+)\s+de\s+(\d+)', gia_response, re.IGNORECASE)
    if match_paso:
        paso_actual = match_paso.group(1)
        total_pasos = match_paso.group(2)
        registrar_timeline(
            project.id,
            f"Paso {paso_actual} de {total_pasos}",
            tipo="montaje"
        )
        # actualizo progreso en extra_data
        extra = project.extra_data or {}
        extra["current_step"] = int(paso_actual)
        extra["total_steps"] = int(total_pasos)
        project.extra_data = extra
        project.progress = round((int(paso_actual) / int(total_pasos)) * 100)

    # detecto si el proyecto se completó
    if re.search(r'completado|finalizado|terminado|montaje completo|listo para usar', gia_response, re.IGNORECASE):
        registrar_timeline(
            project.id,
            "Proyecto marcado como completado por GIA",
            tipo="completado"
        )

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
    """
    endpoint de visión de imágenes.
    sube imagen a cloudinary → claude haiku la analiza → gia responde.
    claude vision está desacoplado en image_service.py.
    groq sigue siendo el motor conversacional.
    """
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

        # guardo la foto en ProjectPhoto para que aparezca en el expediente del proyecto
        foto_proyecto = ProjectPhoto(
            project_id=project.id,
            url=image_url,
            caption="Foto enviada en chat"
        )
        db.session.add(foto_proyecto)

    except Exception as err:
        raise APIException(f"error subiendo imagen a cloudinary: {str(err)}", status_code=500)


    project_context = None
    if project.title:
        project_context = f"Proyecto: {project.title}"
        if project.status:
            project_context += f"\nEstado: {project.status}"

    resultado_vision = analyze_image(
        image_url=image_url,
        project_context=project_context
    )

    gia_response = resultado_vision["analysis"]

    es_primera = len(project.chat_history) == 0
    if es_primera and not project.title:
        project.title = "Análisis de imagen"

    # registro la foto en el timeline
    registrar_timeline(
        project.id,
        "Fotografía enviada para análisis visual",
        tipo="info"
    )

    chat_entry = ChatHistory(
        project_id=project.id,
        user_message="[imagen enviada para análisis]",
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=resultado_vision.get("tokens_used", 0)
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