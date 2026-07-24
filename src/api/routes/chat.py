from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, Manual, ChatHistory
from api.utils import APIException
from api.groq_service import send_message as groq_send
from api.knowledge_service import buscar_chunks_relevantes, construir_contexto

# creo el blueprint de chat
chat_bp = Blueprint('chat', __name__)


@chat_bp.route('', methods=['POST'])
@jwt_required()
def send_message():
    """
    endpoint principal de gia. el usuario manda un mensaje y gia responde.
    si conversation_id es null, creamos una conversacion nueva automaticamente.
    si hay manual, buscamos chunks relevantes antes de llamar a groq.
    """
    # saco el user_id del token, nunca del body (seguridad)
    user_id = int(get_jwt_identity())

    # obtengo el cuerpo de la peticion
    body = request.get_json(silent=True)
    if not body or not body.get("message"):
        raise APIException("necesito un mensaje", status_code=400)

    user_message = body.get("message")
    conversation_id = body.get("conversation_id")

    # --- OBTENER O CREAR LA CONVERSACION ---

    if conversation_id is None:
        # el usuario empieza una conversacion nueva
        # creamos el project automaticamente, sin titulo por ahora
        # groq generara el titulo con la primera respuesta
        project = Project(
            user_id=user_id,
            title=None,
            status="en_progreso"
        )
        db.session.add(project)
        db.session.flush()  # flush para obtener el id sin hacer commit todavia
        es_primer_mensaje = True
    else:
        # el usuario continua una conversacion existente
        project = Project.query.get(conversation_id)
        if not project:
            raise APIException("conversacion no encontrada", status_code=404)
        if project.user_id != user_id:
            raise APIException("no tienes permiso para esta conversacion", status_code=403)
        es_primer_mensaje = len(project.chat_history) == 0

    # --- CONSTRUIR CONTEXTO DEL MANUAL (si existe) ---

    contexto = None
    manual = Manual.query.filter_by(project_id=project.id, status="listo").first()

    if manual:
        # busco los fragmentos del manual mas relevantes para esta pregunta
        chunks = buscar_chunks_relevantes(user_message, manual.id)
        contexto = construir_contexto(chunks)

    # --- CONSTRUIR HISTORIAL PARA GROQ ---

    # mando los ultimos 20 mensajes para que groq tenga contexto de la conversacion
    historial = []
    ultimos_mensajes = ChatHistory.query.filter_by(
        project_id=project.id
    ).order_by(ChatHistory.created_at.asc()).limit(20).all()

    for entrada in ultimos_mensajes:
        historial.append({"role": "user", "content": entrada.user_message})
        historial.append({"role": "assistant", "content": entrada.gia_response})

    # añado el mensaje actual del usuario al historial
    historial.append({"role": "user", "content": user_message})

    # --- LLAMAR A GROQ ---

    resultado = groq_send(
        messages=historial,
        context=contexto,
        is_first_message=es_primer_mensaje
    )

    gia_response = resultado["response"]
    tokens_used = resultado["tokens_used"]

    # si era el primer mensaje, guardo el titulo que genero groq
    if es_primer_mensaje and resultado.get("title"):
        project.title = resultado["title"]

    # --- GUARDAR EN BD ---

    chat_entry = ChatHistory(
        project_id=project.id,
        user_message=user_message,
        gia_response=gia_response,
        chunks_used=[],
        tokens_used=tokens_used
    )

    db.session.add(chat_entry)
    db.session.commit()

    # --- RESPUESTA AL FRONTEND ---

    return jsonify({
        "conversation_id": project.id,
        "message": {
            "role": "assistant",
            "content": gia_response,
            "created_at": chat_entry.created_at.isoformat()
        },
        "title": project.title
    }), 200