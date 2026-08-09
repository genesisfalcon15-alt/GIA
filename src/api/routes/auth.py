from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token
from api.models import db, User
from api.utils import APIException

# creo el blueprint de autenticacion
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    body = request.get_json(silent=True)

    # compruebo que me llegan los datos minimos
    if not body:
        raise APIException("no me llego ningun dato", status_code=400)
    if not body.get("email"):
        raise APIException("falta el email", status_code=400)
    if not body.get("password"):
        raise APIException("falta la contraseña", status_code=400)

    email = body.get("email").strip().lower()
    password = body.get("password")
    role = body.get("role", "particular")

    # miro si ya existe alguien con ese email
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        raise APIException("ya existe una cuenta con este email", status_code=409)

    # creo el usuario y le pongo la contraseña encriptada
    new_user = User()
    new_user.email = email
    new_user.role = role
    new_user.is_active = True
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # devuelvo el token igual que en login para que el frontend lo guarde
    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "token": access_token,
        "user": new_user.serialize()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    body = request.get_json(silent=True)

    if not body:
        raise APIException("no me llego ningun dato", status_code=400)
    if not body.get("email"):
        raise APIException("falta el email", status_code=400)
    if not body.get("password"):
        raise APIException("falta la contraseña", status_code=400)

    email = body.get("email").strip().lower()
    password = body.get("password")

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        raise APIException("email o contraseña incorrectos", status_code=401)

    if not user.is_active:
        raise APIException("esta cuenta esta desactivada", status_code=403)

    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": access_token,
        "user": user.serialize()
    }), 200