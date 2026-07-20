"""
aqui van todos los endpoints de la api
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from flask_jwt_extended import create_access_token
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# permito peticiones cors a esta api
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


@api.route('/register', methods=['POST'])
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
    role = body.get("role", "particular")  # si no manda rol, particular por defecto

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

    return jsonify(new_user.serialize()), 201


@api.route('/login', methods=['POST'])
def login():
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

    # busco al usuario por email
    user = User.query.filter_by(email=email).first()

    # si no existe o la contraseña no coincide, mismo error para los dos casos
    # (asi no le digo a un atacante si el email existe o no)
    if not user or not user.check_password(password):
        raise APIException("email o contraseña incorrectos", status_code=401)

    if not user.is_active:
        raise APIException("esta cuenta esta desactivada", status_code=403)

    # genero el token jwt, metiendo el id del usuario dentro
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": access_token,
        "user": user.serialize()
    }), 200