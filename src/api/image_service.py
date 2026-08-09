import anthropic
import base64
import requests
import os
from PIL import Image
from io import BytesIO

# capa de visión desacoplada — si cambiamos de proveedor solo tocamos este archivo

VISION_PROMPT = """Eres GIA, especialista técnico en montaje, instalación, reparación y restauración.

Tu tarea es inspeccionar visualmente el objeto de la fotografía como lo haría un técnico experimentado.

REGLA 1 — IDENTIFICAR EL OBJETO PRIMERO:
Antes de cualquier análisis, identifica exactamente qué objeto aparece.
Si es una mesa → "mesa". Si es una silla → "silla". Si es un armario → "armario". Si es una lavadora → "lavadora".
NUNCA describas el material como si fuera el objeto. Una mesa no es "madera". Una silla no es "estructura metálica".
Si el objeto está dañado, sigue siendo el mismo objeto: "mesa rota", no "piezas de madera".

REGLA 2 — SOLO LO QUE VES:
Describe únicamente lo que puedes observar directamente.
Si no puedes confirmarlo → "No puedo confirmarlo con esta imagen."
Si la imagen es ambigua → pide exactamente la foto que necesitas.
NUNCA inventes daños, piezas, tornillos, materiales o problemas.

REGLA 3 — SEPARA SIEMPRE:
HECHO VISIBLE: lo que se ve claramente.
POSIBLE: hipótesis razonable basada en lo visible, usando "parece que" o "podría ser".
NO CONFIRMADO: lo que no puede verse.

REGLA 4 — AYUDA CONCRETA:
Una vez identificado el objeto y el daño, explica cómo repararlo.
Adapta siempre la solución al objeto concreto — no des respuestas genéricas.
Indica herramientas, materiales y pasos específicos para ESE objeto.

FORMATO DE RESPUESTA cuando el objeto sea identificable:

Objeto identificado: [qué es exactamente]
Lo que veo: [hechos visibles]
Daño o problema: [daño visible o "no se observa daño evidente"]
No puedo confirmar: [elementos ocultos o ambiguos]
¿Se puede reparar?: [valoración razonada]
Qué haría: [procedimiento concreto adaptado al objeto]
Herramientas: [lista]
Materiales: [lista]
Precauciones: [riesgos reales]

Si necesitas otra foto, indica exactamente qué fotografía y desde qué ángulo.

Si NO puedes identificar el objeto con suficiente seguridad:
Responde: "No puedo identificar con suficiente seguridad el objeto de esta fotografía." y pide la foto concreta que necesitas.

Responde siempre en español. Sin asteriscos. Sin negritas."""


def convertir_a_jpeg(image_content):
    """convierte cualquier formato a jpeg para compatibilidad con claude."""
    img = Image.open(BytesIO(image_content))
    if img.mode in ('RGBA', 'P', 'LA'):
        img = img.convert('RGB')
    output = BytesIO()
    img.save(output, format='JPEG', quality=90)
    return output.getvalue()


def analyze_image(image_url, project_context=None):
    """
    analiza una imagen usando claude haiku con visión real.
    devuelve análisis estructurado separando hechos de hipótesis.
    """
    try:
        response = requests.get(image_url, timeout=10)
        if response.status_code != 200:
            raise Exception(f"no pude descargar la imagen: {response.status_code}")

        # convierto siempre a jpeg — claude no acepta heic ni otros formatos
        image_content = convertir_a_jpeg(response.content)
        image_data = base64.standard_b64encode(image_content).decode("utf-8")

        prompt = VISION_PROMPT
        if project_context:
            prompt += f"\n\nContexto del proyecto activo:\n{project_context}\nUsa este contexto para interpretar mejor la imagen, pero nunca inventes lo que no puedes ver."

        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=800,
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
        )

        analysis = message.content[0].text.replace("**", "")
        print(f"=== VISION: OK — {message.usage.input_tokens} tokens entrada, {message.usage.output_tokens} salida ===")

        return {
            "success": True,
            "analysis": analysis,
            "tokens_used": message.usage.input_tokens + message.usage.output_tokens
        }

    except Exception as err:
        print(f"=== VISION: error — {err} ===")
        return {
            "success": False,
            "analysis": "No pude analizar la imagen en este momento. Descríbeme qué ves o qué problema tienes y te ayudo igualmente.",
            "tokens_used": 0
        }