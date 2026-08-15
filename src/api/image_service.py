import anthropic
import base64
import requests
import os
from PIL import Image
from io import BytesIO

VISION_PROMPT = """Eres GIA, una asistente inteligente especializada en ayudar al usuario con tareas reales del hogar.

Estás analizando una fotografía que forma parte de una conversación activa. No estás viendo una imagen aislada.

Ya tienes contexto: sabes qué está haciendo el usuario, qué quiere conseguir y cuál es el problema. Usa esa información.

==================================================
TU ÚNICA TAREA
==================================================

Interpretar lo que aparece en la imagen para ayudar al usuario a avanzar en su tarea.

No describas la fotografía.
No enumeres lo que ves.
No generes un informe.
No uses estructuras prefabricadas.
No repitas información que ya sabes por el contexto.
No preguntes por una intención que el usuario ya ha expresado.

==================================================
CONTEXTO PRIMERO
==================================================

Antes de interpretar la imagen, utiliza el contexto de la conversación.

Si el contexto indica que el usuario tiene una mesa rota y quiere repararla, busca en la imagen la rotura. Habla de la rotura. Decide cómo avanzar con la reparación.

Si el contexto indica que está montando un mueble en el paso 4, analiza si lo que ves corresponde a ese paso hecho correctamente o no.

Si el contexto indica que está instalando algo, analiza la imagen desde esa perspectiva.

El contexto define qué es relevante en la imagen. Todo lo demás no existe.

==================================================
QUÉ IGNORAR COMPLETAMENTE
==================================================

Ignora y no menciones salvo que sean directamente relevantes para resolver el problema:

suelo, paredes, techo, parquet, iluminación, colores del entorno, muebles del fondo, decoración, objetos secundarios, plástico de embalaje, papel protector, cajas, bolsas, ubicación de la fotografía, composición visual, estética de la escena.

Si algo de lo anterior no ayuda al usuario a resolver su problema, no lo menciones.

==================================================
CÓMO RESPONDER
==================================================

Responde como GIA en conversación directa con el usuario.

Si ves claramente el problema → nómbralo, relaciónalo con el objetivo del usuario y propón el siguiente paso útil.

Si no puedes confirmar algo → dilo de forma natural y pide exactamente la fotografía que necesitas, desde qué ángulo y de qué zona concreta.

Si detectas un riesgo de seguridad → menciónalo antes de continuar.

Máximo 3-4 líneas en situaciones simples. Sin listas innecesarias. Sin estructuras. Sin asteriscos. Sin negritas.

Responde siempre en español.

==================================================
REGLA FINAL
==================================================

La imagen es una fuente de información para ayudar al usuario.

No es el tema de la conversación.

Tu objetivo es siempre:

CONTEXTO → IMAGEN → INTERPRETACIÓN → SIGUIENTE PASO ÚTIL"""


def redimensionar_imagen(image_content, max_px=1024):
    """
    redimensiona la imagen a máximo 1024px en el lado mayor manteniendo proporción.
    solo en memoria — la imagen original en cloudinary no se toca.
    """
    img = Image.open(BytesIO(image_content))

    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')

    ancho, alto = img.size
    if ancho > max_px or alto > max_px:
        ratio = min(max_px / ancho, max_px / alto)
        nuevo_ancho = int(ancho * ratio)
        nuevo_alto = int(alto * ratio)
        img = img.resize((nuevo_ancho, nuevo_alto), Image.LANCZOS)
        print(f"=== VISION: imagen redimensionada de {ancho}x{alto} a {nuevo_ancho}x{nuevo_alto} ===")
    else:
        print(f"=== VISION: imagen dentro del límite ({ancho}x{alto}) ===")

    output = BytesIO()
    img.save(output, format='JPEG', quality=85)
    return output.getvalue()


def analyze_image(image_url, project_context=None):
    """
    analiza una imagen usando claude haiku con visión real.

    - descarga desde cloudinary
    - redimensiona a máximo 1024px en memoria
    - timeout de 30 segundos
    - devuelve tokens reales de entrada y salida
    - usa el contexto del proyecto para contextualizar el análisis
    """
    try:
        response = requests.get(image_url, timeout=10)
        if response.status_code != 200:
            raise Exception(f"no pude descargar la imagen: {response.status_code}")

        image_content = redimensionar_imagen(response.content, max_px=1024)
        image_data = base64.standard_b64encode(image_content).decode("utf-8")

        prompt = VISION_PROMPT
        if project_context:
            prompt += f"\n\nCONTEXTO DEL PROYECTO ACTIVO:\n{project_context}\nUsa este contexto para interpretar la imagen. Si el paso actual indica qué se está haciendo, analiza si lo que ves es correcto para ese paso."

        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=400,
            system=prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": "Analiza esta imagen."
                        }
                    ],
                }
            ],
            timeout=30.0
        )

        analysis = message.content[0].text.replace("**", "")

        input_tokens = message.usage.input_tokens
        output_tokens = message.usage.output_tokens
        total_tokens = input_tokens + output_tokens

        print(f"=== VISION: OK — {input_tokens} tokens entrada, {output_tokens} tokens salida ===")

        return {
            "success": True,
            "analysis": analysis,
            "tokens_used": total_tokens,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens
        }

    except anthropic.APITimeoutError:
        print(f"=== VISION: timeout de 30s superado ===")
        return {
            "success": False,
            "analysis": "El análisis tardó demasiado. Inténtalo de nuevo con una foto más pequeña o en un momento de menos carga.",
            "tokens_used": 0,
            "input_tokens": 0,
            "output_tokens": 0
        }

    except Exception as err:
        print(f"=== VISION: error — {err} ===")
        return {
            "success": False,
            "analysis": "No pude analizar la imagen en este momento. Descríbeme qué ves y te ayudo igualmente.",
            "tokens_used": 0,
            "input_tokens": 0,
            "output_tokens": 0
        }