from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, ProjectTimeline
from api.utils import APIException
from datetime import datetime

# blueprint de conversaciones, gestiona el historial del sidebar
conversations_bp = Blueprint('conversations', __name__)


@conversations_bp.route('', methods=['GET'])
@jwt_required()
def get_conversations():
    """
    devuelve todas las conversaciones del usuario autenticado
    ordenadas por la mas reciente primero, para el sidebar
    """
    user_id = int(get_jwt_identity())

    conversaciones = Project.query.filter_by(
        user_id=user_id
    ).order_by(Project.updated_at.desc()).all()

    return jsonify({
        "items": [c.serialize() for c in conversaciones],
        "total": len(conversaciones)
    }), 200


@conversations_bp.route('/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """
    devuelve una conversacion completa con todos sus mensajes
    """
    user_id = int(get_jwt_identity())

    conversacion = Project.query.get(conversation_id)
    if not conversacion:
        raise APIException("conversacion no encontrada", status_code=404)
    if conversacion.user_id != user_id:
        raise APIException("no tienes permiso para esta conversacion", status_code=403)

    mensajes = []
    for entrada in conversacion.chat_history:
        mensajes.append({
            "role": "user",
            "content": entrada.user_message,
            "created_at": entrada.created_at.isoformat()
        })
        mensajes.append({
            "role": "assistant",
            "content": entrada.gia_response,
            "created_at": entrada.created_at.isoformat()
        })

    manual = None
    if conversacion.manuals:
        m = conversacion.manuals[0]
        manual = {
            "id": m.id,
            "filename": m.original_filename,
            "status": m.status,
            "total_chunks": m.total_chunks
        }

    return jsonify({
        "id": conversacion.id,
        "title": conversacion.title or "Nueva conversación",
        "status": conversacion.status,
        "created_at": conversacion.created_at.isoformat(),
        "messages": mensajes,
        "manual": manual
    }), 200


@conversations_bp.route('/<int:conversation_id>', methods=['PATCH'])
@jwt_required()
def update_conversation_status(conversation_id):
    """
    actualiza el status del proyecto — completado, pendiente_confirmar, etc.
    nunca borra datos, solo cambia el estado
    """
    user_id = int(get_jwt_identity())

    conversacion = Project.query.get(conversation_id)
    if not conversacion:
        raise APIException("conversacion no encontrada", status_code=404)
    if conversacion.user_id != user_id:
        raise APIException("no tienes permiso para esta conversacion", status_code=403)

    body = request.get_json(silent=True)
    if not body:
        raise APIException("faltan datos", status_code=400)

    # estados permitidos
    estados_validos = [
        "en_progreso", "pendiente_confirmar", "completado",
        "pausado", "instalado", "reparado", "restaurado",
        "desmontado", "cancelado"
    ]

    nuevo_status = body.get("status")
    if nuevo_status and nuevo_status not in estados_validos:
        raise APIException(f"estado no válido: {nuevo_status}", status_code=400)

    status_anterior = conversacion.status

    if nuevo_status:
        conversacion.status = nuevo_status

    # registra el cambio en el timeline automáticamente
    if nuevo_status and nuevo_status != status_anterior:
        evento = ProjectTimeline()
        evento.project_id = conversacion.id
        evento.tipo = nuevo_status
        evento.evento = f"Estado actualizado a: {nuevo_status}"
        db.session.add(evento)

    conversacion.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        "id": conversacion.id,
        "status": conversacion.status,
        "message": "estado actualizado"
    }), 200


@conversations_bp.route('/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """
    borra una conversacion completa con todos sus mensajes y manual
    """
    user_id = int(get_jwt_identity())

    conversacion = Project.query.get(conversation_id)
    if not conversacion:
        raise APIException("conversacion no encontrada", status_code=404)
    if conversacion.user_id != user_id:
        raise APIException("no tienes permiso para borrar esta conversacion", status_code=403)

    db.session.delete(conversacion)
    db.session.commit()

    return jsonify({"message": "conversacion eliminada"}), 200