import os
import requests
from flask import request, jsonify, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from api.models import db, Project, Manual, ManualChunk, ChatHistory
from api.utils import APIException

# creo el blueprint de chat
chat_bp = Blueprint('chat', __name__)

# system prompt de GIA
GIA_SYSTEM_PROMPT = """Eres GIA, una asistente experta en montajes de muebles e instalaciones.
Tu objetivo es ayudar a los usuarios respondiendo SOLO con la información del manual que te proporcionan.
Si la pregunta no se puede responder con el manual, di claramente que no tienes esa información.
Sé conciso, práctico y amigable. Responde en español."""


@chat_bp.route('/<int:project_id>/message', methods=['POST'])
@jwt_required()
def send_message(project_id):
    """
    el usuario pregunta algo sobre su manual
    buscamos los chunks relevantes y los mandamos a groq
    """
    # saco el user_id del token
    user_id = int(get_jwt_identity())
    
    # verifico que el proyecto existe y pertenece al usuario
    project = Project.query.get(project_id)
    if not project:
        raise APIException("proyecto no encontrado", status_code=404)
    if project.user_id != user_id:
        raise APIException("no tienes permiso para este proyecto", status_code=403)
    
    # obtengo la pregunta del usuario
    body = request.get_json(silent=True)
    if not body or not body.get("message"):
        raise APIException("necesito una pregunta", status_code=400)
    
    user_message = body.get("message")
    
    # busco el manual del proyecto (asumimos que tiene uno)
    manual = Manual.query.filter_by(project_id=project_id).first()
    if not manual:
        raise APIException("este proyecto no tiene manual", status_code=404)
    
    if manual.status != "listo":
        raise APIException(f"el manual está en estado {manual.status}", status_code=400)
    
    # TODO: aqui irá la búsqueda por embeddings (similitud semántica)
    # por ahora, buscamos chunks que contengan palabras de la pregunta
    palabras_clave = user_message.lower().split()
    
    chunks_relevantes = []
    todos_los_chunks = ManualChunk.query.filter_by(manual_id=manual.id).all()
    
    for chunk in todos_los_chunks:
        # contar cuántas palabras clave hay en el chunk
        coincidencias = sum(1 for palabra in palabras_clave if palabra in chunk.content.lower())
        if coincidencias > 0:
            chunks_relevantes.append((chunk, coincidencias))
    
    # ordeno por relevancia (más coincidencias primero) y cojo los top 5
    chunks_relevantes.sort(key=lambda x: x[1], reverse=True)
    chunks_top = [chunk for chunk, _ in chunks_relevantes[:5]]
    
    # si no hay chunks relevantes, devuelvo error
    if not chunks_top:
        chunks_top = todos_los_chunks[:3]  # si no hay nada, devuelvo los primeros 3
    
    # armo el contexto: junta todos los chunks relevantes
    contexto = "\n\n---\n\n".join([chunk.content for chunk in chunks_top])
    
    # llamo a groq con el contexto y la pregunta
    try:
        groq_response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "mixtral-8x7b-32768",  # o el modelo que prefieras
                "messages": [
                    {
                        "role": "system",
                        "content": GIA_SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": f"Aquí está el manual:\n\n{contexto}\n\nLa pregunta es: {user_message}"
                    }
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
        )
        
        groq_data = groq_response.json()
        
        if groq_response.status_code != 200:
            raise APIException(f"error en groq: {groq_data}", status_code=500)
        
        gia_response = groq_data["choices"][0]["message"]["content"]
        tokens_used = groq_data.get("usage", {}).get("total_tokens", 0)
        
    except Exception as err:
        raise APIException(f"error llamando a groq: {str(err)}", status_code=500)
    
    # guardo la conversación en la bd
    chat_entry = ChatHistory(
        project_id=project_id,
        user_message=user_message,
        gia_response=gia_response,
        chunks_used=[chunk.id for chunk in chunks_top],
        tokens_used=tokens_used
    )
    
    db.session.add(chat_entry)
    db.session.commit()
    
    return jsonify({
        "user_message": user_message,
        "gia_response": gia_response,
        "chunks_used": len(chunks_top),
        "tokens_used": tokens_used
    }), 200