from flask import Blueprint
from flask_cors import CORS

# importo los blueprints de cada modulo
from api.routes.auth import auth_bp
from api.routes.manuals import manuals_bp

# creo el blueprint principal que va a contener todos los demas
api = Blueprint('api', __name__)

# permito peticiones cors desde el frontend
CORS(api)

# registro los blueprints bajo sus prefijos
api.register_blueprint(auth_bp, url_prefix='/auth')
api.register_blueprint(manuals_bp, url_prefix='/manuals')