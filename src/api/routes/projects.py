import cloudinary
import cloudinary.uploader
import os
from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, ProjectTimeline, ProjectNote, ProjectPhoto
from api.utils import APIException

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

projects_bp = Blueprint('projects', __name__)


@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    """devuelve todos los proyectos del usuario autenticado"""
    user_id = int(get_jwt_identity())
    projects = Project.query.filter_by(user_id=user_id).order_by(Project.updated_at.desc()).all()
    return jsonify([p.serialize() for p in projects]), 200


@projects_bp.route('/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project(project_id):
    """devuelve el detalle completo de un proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        raise APIException("proyecto no encontrado", status_code=404)
    if project.user_id != user_id:
        raise APIException("no tienes permiso", status_code=403)

    data = project.serialize()
    data['timeline'] = [t.serialize() for t in project.timeline]
    data['notes'] = [n.serialize() for n in project.notes]
    data['photos'] = [p.serialize() for p in project.photos]

    return jsonify(data), 200


@projects_bp.route('/<int:project_id>', methods=['PATCH'])
@jwt_required()
def update_project(project_id):
    """actualiza estado, categoría o progreso de un proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        raise APIException("proyecto no encontrado", status_code=404)
    if project.user_id != user_id:
        raise APIException("no tienes permiso", status_code=403)

    body = request.get_json()

    if 'status' in body:
        project.status = body['status']
    if 'category' in body:
        project.category = body['category']
    if 'progress' in body:
        project.progress = body['progress']
    if 'time_invested' in body:
        project.time_invested = body['time_invested']
    if 'title' in body:
        project.title = body['title']

    db.session.commit()
    return jsonify(project.serialize()), 200


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
@jwt_required()
def delete_project(project_id):
    """elimina un proyecto y todo lo relacionado"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project:
        raise APIException("proyecto no encontrado", status_code=404)
    if project.user_id != user_id:
        raise APIException("no tienes permiso", status_code=403)

    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "proyecto eliminado"}), 200


@projects_bp.route('/<int:project_id>/timeline', methods=['POST'])
@jwt_required()
def add_timeline_event(project_id):
    """añade un evento a la línea temporal del proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    body = request.get_json()
    evento = ProjectTimeline(
        project_id=project_id,
        evento=body.get('evento', ''),
        tipo=body.get('tipo', 'info')
    )
    db.session.add(evento)
    db.session.commit()
    return jsonify(evento.serialize()), 201


@projects_bp.route('/<int:project_id>/notes', methods=['GET'])
@jwt_required()
def get_notes(project_id):
    """devuelve las notas del proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    return jsonify([n.serialize() for n in project.notes]), 200


@projects_bp.route('/<int:project_id>/notes', methods=['POST'])
@jwt_required()
def add_note(project_id):
    """añade una nota personal al proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    body = request.get_json()
    note = ProjectNote(
        project_id=project_id,
        content=body.get('content', '')
    )
    db.session.add(note)
    db.session.commit()
    return jsonify(note.serialize()), 201


@projects_bp.route('/<int:project_id>/notes/<int:note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(project_id, note_id):
    """elimina una nota del proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    note = ProjectNote.query.get(note_id)
    if not note or note.project_id != project_id:
        raise APIException("nota no encontrada", status_code=404)

    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "nota eliminada"}), 200


@projects_bp.route('/<int:project_id>/step', methods=['PATCH'])
@jwt_required()
def update_step(project_id):
    """actualiza el paso actual del montaje en extra_data"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    body = request.get_json()
    current_step = body.get("current_step")
    total_steps = body.get("total_steps")

    extra = project.extra_data or {}
    if current_step is not None:
        extra["current_step"] = current_step
    if total_steps is not None:
        extra["total_steps"] = total_steps
    project.extra_data = extra

    if current_step and total_steps:
        project.progress = round((current_step / total_steps) * 100)

    db.session.commit()
    return jsonify(project.serialize()), 200


@projects_bp.route('/<int:project_id>/photos', methods=['GET'])
@jwt_required()
def get_photos(project_id):
    """devuelve las fotos del proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    return jsonify([p.serialize() for p in project.photos]), 200


@projects_bp.route('/<int:project_id>/photos', methods=['POST'])
@jwt_required()
def upload_photo(project_id):
    """
    sube una foto al proyecto y la guarda en cloudinary y en BD.
    acepta jpg, jpeg, png, webp, heic.
    """
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    if 'photo' not in request.files:
        raise APIException("no llegó ninguna foto", status_code=400)

    file = request.files['photo']
    if file.filename == '':
        raise APIException("el archivo está vacío", status_code=400)

    caption = request.form.get('caption', '')

    try:
        file_content = file.read()
        upload_response = cloudinary.uploader.upload(
            file_content,
            resource_type="image",
            folder=f"gia/project_{project_id}/photos"
        )
        photo_url = upload_response['secure_url']
        print(f"=== FOTO: subida a cloudinary → {photo_url} ===")
    except Exception as err:
        raise APIException(f"error subiendo foto a cloudinary: {str(err)}", status_code=500)

    photo = ProjectPhoto(
        project_id=project_id,
        url=photo_url,
        caption=caption or None
    )
    db.session.add(photo)
    db.session.commit()

    return jsonify(photo.serialize()), 201


@projects_bp.route('/<int:project_id>/photos/<int:photo_id>', methods=['DELETE'])
@jwt_required()
def delete_photo(project_id, photo_id):
    """elimina una foto del proyecto"""
    user_id = int(get_jwt_identity())
    project = Project.query.get(project_id)
    if not project or project.user_id != user_id:
        raise APIException("no autorizado", status_code=403)

    photo = ProjectPhoto.query.get(photo_id)
    if not photo or photo.project_id != project_id:
        raise APIException("foto no encontrada", status_code=404)

    db.session.delete(photo)
    db.session.commit()
    return jsonify({"message": "foto eliminada"}), 200