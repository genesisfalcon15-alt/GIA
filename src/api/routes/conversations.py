from flask import jsonify, Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, ProjectTimeline
from api.utils import APIException
from datetime import datetime

conversations_bp = Blueprint('conversations', __name__)


@conversations_bp.route('', methods=['GET'])
@jwt_required()
def get_conversations():
    """
    devuelve conversaciones del usuario.
    ?type=guia → solo guías (category = 'guia')
    ?type=montaje → solo montajes (category IS NULL OR category != 'guia')
    sin parámetro → todas
    """
    user_id = int(get_jwt_identity())
    tipo = request.args.get('type', None)

    query = Project.query.filter_by(user_id=user_id)

    if tipo == 'guia':
        query = query.filter(Project.category == 'guia')
    elif tipo == 'montaje':
        query = query.filter(
            db.or_(
                Project.category == None,
                Project.category != 'guia'
            )
        )

    conversaciones = query.order_by(Project.updated_at.desc()).all()

    return jsonify({
        "items": [c.serialize() for c in conversaciones],
        "total": len(conversaciones)
    }), 200


@conversations_bp.route('/<int:conversation_id>', methods=['GET'])
@jwt_required()
def get_conversation(conversation_id):
    """devuelve una conversacion completa con todos sus mensajes"""
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

    # incluyo todos los manuales del proyecto
    manuales = []
    for m in conversacion.manuals:
        manuales.append({
            "id": m.id,
            "filename": m.original_filename,
            "status": m.status,
            "total_chunks": m.total_chunks,
            "file_url": m.file_url,
            "created_at": m.created_at.isoformat()
        })

    return jsonify({
        "id": conversacion.id,
        "title": conversacion.title or "Nueva conversación",
        "status": conversacion.status,
        "category": conversacion.category,
        "created_at": conversacion.created_at.isoformat(),
        "messages": mensajes,
        "manual": manuales[0] if manuales else None,
        "manuales": manuales,
        "has_manual": len(manuales) > 0
    }), 200


@conversations_bp.route('/<int:conversation_id>', methods=['PATCH'])
@jwt_required()
def update_conversation_status(conversation_id):
    """actualiza status y/o category del proyecto — nunca borra datos"""
    user_id = int(get_jwt_identity())

    conversacion = Project.query.get(conversation_id)
    if not conversacion:
        raise APIException("conversacion no encontrada", status_code=404)
    if conversacion.user_id != user_id:
        raise APIException("no tienes permiso para esta conversacion", status_code=403)

    body = request.get_json(silent=True)
    if not body:
        raise APIException("faltan datos", status_code=400)

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

    # permite marcar un proyecto como guía o volver a montaje
    if "category" in body:
        categorias_validas = ["guia", "montaje", "instalacion", "reparacion", "restauracion"]
        nueva_categoria = body.get("category")
        if nueva_categoria is not None and nueva_categoria not in categorias_validas:
            raise APIException(f"categoría no válida: {nueva_categoria}", status_code=400)
        conversacion.category = nueva_categoria

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
        "category": conversacion.category,
        "message": "actualizado"
    }), 200


@conversations_bp.route('/<int:conversation_id>', methods=['DELETE'])
@jwt_required()
def delete_conversation(conversation_id):
    """borra una conversacion completa"""
    user_id = int(get_jwt_identity())

    conversacion = Project.query.get(conversation_id)
    if not conversacion:
        raise APIException("conversacion no encontrada", status_code=404)
    if conversacion.user_id != user_id:
        raise APIException("no tienes permiso para borrar esta conversacion", status_code=403)

    db.session.delete(conversacion)
    db.session.commit()

    return jsonify({"message": "conversacion eliminada"}), 200