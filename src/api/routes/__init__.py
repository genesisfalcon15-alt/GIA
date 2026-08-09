from flask import Blueprint
from flask_cors import CORS

from api.routes.auth import auth_bp
from api.routes.manuals import manuals_bp
from api.routes.chat import chat_bp
from api.routes.conversations import conversations_bp
from api.routes.projects import projects_bp
from api.routes.users import users_bp

api = Blueprint('api', __name__)

CORS(api)

api.register_blueprint(auth_bp, url_prefix='/auth')
api.register_blueprint(manuals_bp, url_prefix='/manuals')
api.register_blueprint(chat_bp, url_prefix='/chat')
api.register_blueprint(conversations_bp, url_prefix='/conversations')
api.register_blueprint(projects_bp, url_prefix='/projects')
api.register_blueprint(users_bp, url_prefix='/users')