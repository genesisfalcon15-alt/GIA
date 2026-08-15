from flask import request, jsonify, Blueprint
from flask_jwt_extended import create_access_token
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from api.models import db, User
from api.utils import APIException

auth_bp = Blueprint('auth', __name__)

# limiter propio para auth — evita circular import con app.py
limiter = Limiter(get_remote_address, storage_uri="memory://")


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    body = request.get_json(silent=True)

    if not body:
        raise APIException("no me llego ningun dato", status_code=400)
    if not body.get("email"):
        raise APIException("falta el email", status_code=400)
    if not body.get("password"):
        raise APIException("falta la contraseña", status_code=400)

    email = body.get("email").strip().lower()
    password = body.get("password")
    role = body.get("role", "particular")
    name = body.get("name", "").strip()

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        raise APIException("ya existe una cuenta con este email", status_code=409)

    new_user = User()
    new_user.email = email
    new_user.role = role
    new_user.is_active = True
    new_user.name = name if name else None
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    access_token = create_access_token(identity=str(new_user.id))
    return jsonify({
        "token": access_token,
        "user": new_user.serialize()
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per hour")
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