from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, UserProfile
from api.utils import APIException

users_bp = Blueprint('users', __name__)


@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """devuelve el perfil del onboarding del usuario"""
    user_id = int(get_jwt_identity())
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        return jsonify({}), 200
    return jsonify(profile.serialize()), 200


@users_bp.route('/profile', methods=['POST'])
@jwt_required()
def save_profile():
    """guarda o actualiza el perfil del onboarding en BD"""
    user_id = int(get_jwt_identity())
    body = request.get_json()

    # si ya existe lo actualizo, si no lo creo
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)

    if 'experience_level' in body:
        profile.experience_level = body['experience_level']
    if 'home_type' in body:
        profile.home_type = body['home_type']
    if 'wall_types' in body:
        profile.wall_types = body['wall_types']
    if 'tools_available' in body:
        profile.tools_available = body['tools_available']
    if 'interests' in body:
        profile.interests = body['interests']
    if 'help_style' in body:
        profile.help_style = body['help_style']
    if 'sector' in body:
        profile.sector = body['sector']
    if 'team_size' in body:
        profile.team_size = body['team_size']

    db.session.commit()
    return jsonify(profile.serialize()), 200