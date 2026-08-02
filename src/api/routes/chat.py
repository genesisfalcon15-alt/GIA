from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, ChatHistory
from api.utils import APIException
from api.groq_service import send_message as groq_send
from api.conversation_context_service import (
    construir_contexto_conversacion,
    construir_info_manual_para_groq
)

# orquestador del chat, no contiene logica de negocio
# toda la logica conversacional vive en conversation_context_service
chat_bp = Blueprint('chat', __name__)


@chat_bp.route('', methods=['POST'])
@jwt_required()
def send_message():
    """
    endpoint principal de gia.
    orquesta el flujo: obtiene contexto → llama a groq → guarda respuesta
    no construye contexto ni ejecuta logica conversacional
    """
    user_id = int(get_jwt_identity())

    body = request.get_json(silent=True)
    if not body or not body.get("message"):
        raise APIException("necesito un mensaje", status_code=400)

    user_message = body.get("message")
    conversation_id = body.get("conversation_id")

    # obtengo o creo la conversacion
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

    # construyo el historial para groq
    historial = []
    ultimos_mensajes = ChatHistory.query.filter_by(
        project_id=project.id
    ).order_by(ChatHistory.created_at.asc()).limit(20).all()

    for entrada in ultimos_mensajes:
        historial.append({"role": "user", "content": entrada.user_message})
        historial.append({"role": "assistant", "content": entrada.gia_response})

    historial.append({"role": "user", "content": user_message})

    # el conversation_context_service construye todo el contexto
    # resuelve referencias, decide si usar rag y prepara la info del proyecto
    contexto = construir_contexto_conversacion(
        project_id=project.id,
        user_message=user_message,
        historial_groq=historial
    )

    # info del proyecto y manual que groq recibe siempre,
    # independientemente de si el rag encontro fragmentos
    info_manual = construir_info_manual_para_groq(contexto)

    # llamo a groq con todas las capas de contexto
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

    chat_entry = ChatHistory(
        project_id=project.id,
        user_message=user_message,
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=tokens_used
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