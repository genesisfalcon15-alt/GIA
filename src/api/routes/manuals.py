import cloudinary
import cloudinary.uploader
import os
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, Manual
from api.utils import APIException
from api.pdf_processor import extraer_y_trocear_pdf

# configuro cloudinary con las credenciales del .env
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# creo el blueprint de manuales
manuals_bp = Blueprint('manuals', __name__)


@manuals_bp.route('/<int:project_id>/upload', methods=['POST'])
@jwt_required()
def upload_manual(project_id):
    """
    sube un pdf a un proyecto
    el usuario debe ser propietario del proyecto
    """
    # saco el user_id del token, nunca del body (anti-IDOR)
    user_id = int(get_jwt_identity())

    # verifico que el proyecto existe y que el usuario es propietario
    project = Project.query.get(project_id)
    if not project:
        raise APIException("proyecto no encontrado", status_code=404)
    if project.user_id != user_id:
        raise APIException("no tienes permiso para este proyecto", status_code=403)

    # verifico que me enviaron un archivo
    if 'file' not in request.files:
        raise APIException("no me llegó ningun archivo", status_code=400)

    file = request.files['file']
    if file.filename == '':
        raise APIException("el archivo está vacío", status_code=400)

    # verifico que el archivo sea un pdf (extension)
    if not file.filename.lower().endswith('.pdf'):
        raise APIException("solo se aceptan archivos pdf", status_code=400)

    # verifico que es un pdf de verdad (magic bytes: los pdfs empiezan por %PDF)
    file_content = file.read()
    if not file_content.startswith(b'%PDF'):
        raise APIException("el archivo no es un pdf válido", status_code=400)

    # subo a cloudinary
    try:
        upload_response = cloudinary.uploader.upload(
            file_content,
            resource_type="raw",
            folder=f"gia/project_{project_id}",
            public_id=file.filename.replace('.pdf', '')
        )
        file_url = upload_response['secure_url']
    except Exception as err:
        raise APIException(f"error subiendo a cloudinary: {str(err)}", status_code=500)

    # creo el registro en la bd: el manual está en estado "procesando"
    manual = Manual(
        project_id=project_id,
        file_url=file_url,
        original_filename=file.filename,
        status="procesando",
        total_chunks=0
    )

    db.session.add(manual)
    db.session.commit()

    # TODO: lanzar el job asincrónico que procesa el pdf
    # por ahora lo hacemos sincrónico (después pasamos a celery o similar)
    extraer_y_trocear_pdf(file_content, manual.id)

    return jsonify({
        "message": "archivo recibido, procesando...",
        "manual_id": manual.id,
        "status": manual.status
    }), 202