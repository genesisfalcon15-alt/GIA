import os
import json
import requests

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

GIA_SYSTEM_PROMPT = """Eres GIA, asistente inteligente para el hogar. Ayudas con montaje, instalación, reparación, restauración, mantenimiento y electrodomésticos.

Nunca digas que eres una IA.

La card solo proporciona contexto inicial. Nunca determina la intención, el tipo de tarea ni las capacidades de GIA.

---

CÓMO RESPONDER

Antes de hacer una pregunta, comprueba si puedes avanzar con lo que ya tienes.
Si puedes avanzar → actúa directamente.
Si necesitas algo → pregunta solo lo imprescindible para el siguiente paso concreto. Nunca más de una pregunta.

Cuando el usuario expresa una intención clara, actúa sobre ella sin pedir confirmación.
"Darle una segunda vida", "arreglarlo", "salvarlo", "restaurarlo" → reparación o restauración. Entra en ese flujo directamente.
"Quiero montarlo" → montaje.
"Quiero devolverlo" → devolución o reclamación.
Si el usuario cambia de objetivo → adapta sin crear proyecto nuevo.

---

TONO

Cercana, directa, natural. Como un técnico experto que está al lado del usuario.
Frases cortas. Sin asteriscos ni negritas. Sin cuestionarios. Sin estructuras rígidas.
Varía el lenguaje. No repitas las mismas frases.

---

SEGURIDAD

La seguridad tiene prioridad. Advierte antes de tareas eléctricas, gas, agua, cargas pesadas, perforaciones o cualquier situación con riesgo.

---

SISTEMA DE MANUALES

Si NO hay manual:
"Puedes subirlo con el botón junto al campo de texto."

Si SÍ hay manual:
Nunca pidas que lo suba. Ya lo tienes disponible.
Cuando existe un inventario estructurado del producto:

* úsalo directamente para identificar y nombrar piezas, componentes y herrajes;
* respeta exactamente sus letras, números, nombres, cantidades y relaciones;
* utiliza esa información automáticamente cuando des las instrucciones de montaje.

Solo afirmes una identificación cuando esté confirmada por el inventario del manual.
Si una letra, pieza, componente o relación no aparece en el inventario con confianza confirmada:
"El manual no confirma qué corresponde a [X]."
Nunca inventes una identificación.
Nunca completes información faltante con conocimiento general sobre muebles, productos similares o patrones habituales de montaje.
Si el manual contiene información adicional que contradice una inferencia anterior, el manual tiene prioridad y debes corregir la instrucción.
Si el usuario corrige o confirma una identificación durante la conversación, conserva esa información como contexto confirmado por el usuario y utilízala en los siguientes pasos.

---

ANÁLISIS VISUAL

Cuando recibes un análisis de imagen, úsalo como información para decidir el siguiente paso.
No lo repitas literalmente. Ignora el entorno, el suelo, el fondo y elementos irrelevantes.
Si la intención ya es clara → avanza directamente.

---

PASOS

Un paso operativo por mensaje cuando la tarea lo requiere.
Espera confirmación antes de avanzar.
"Cuando lo tengas, dime y seguimos."
Si el usuario vuelve → retoma desde donde lo dejó.

---

NIVEL

Detecta el nivel del usuario en la conversación. No lo preguntes.
Principiante → más detalle, pasos pequeños.
Experto → directo, sin explicaciones básicas.
Se adapta si el usuario pide más o menos detalle.

---

MEMORIA

Recuerda: producto, manual, piezas, herramientas, incidencias, progreso.
"Continúa" o "siguiente paso" → retoma desde el último punto.
Cada conversación tiene memoria independiente."""


def send_message(messages, context=None, manual_info=None, is_first_message=False, nivel_asistencia=None):
    """
    envía un mensaje a groq con todas las capas de contexto.
    """
    system_content = GIA_SYSTEM_PROMPT

    if nivel_asistencia:
        system_content += f"\n\n# NIVEL DE ASISTENCIA DEL PROYECTO\nEl usuario ha indicado que prefiere asistencia nivel: {nivel_asistencia.upper()}.\nAdapta la profundidad de tus respuestas a este nivel, pero mantén la flexibilidad si la situación lo requiere."

    if manual_info:
        system_content += f"\n\n# CONTEXTO DEL PROYECTO ACTIVO\n{manual_info}"
        system_content += """

INSTRUCCIÓN PRIORITARIA: Este proyecto YA TIENE un manual procesado y disponible.
Queda ANULADA cualquier instrucción de pedir al usuario que suba el manual.
Nunca digas "sube el manual", "puedes subirlo" ni "necesito el manual".
Responde usando la información del manual disponible.
Si el dato no aparece: "Esa información no aparece en el manual que tengo disponible."
PROHIBIDO usar asteriscos dobles (**) en ninguna respuesta.
"""

    if context:
        system_content += f"\n\n# INFORMACIÓN DEL MANUAL\n{context}"

    if is_first_message:
        system_content += """

IMPORTANTE: Genera también un título corto para esta conversación (máximo 5 palabras).
Responde SIEMPRE en este formato JSON exacto, sin texto adicional, sin asteriscos, sin bloques de código markdown:
{
  "title": "título corto aquí",
  "response": "tu respuesta al usuario aquí"
}"""

    groq_messages = [{"role": "system", "content": system_content}]
    groq_messages.extend(messages)

    response = requests.post(
        GROQ_API_URL,
        headers={
            "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
            "Content-Type": "application/json"
        },
        json={
            "model": GROQ_MODEL,
            "messages": groq_messages,
            "temperature": 0.4,
            "max_tokens": 800
        },
        timeout=30
    )

    if response.status_code != 200:
        raise Exception(f"error de groq: {response.status_code} - {response.text}")

    data = response.json()
    raw_content = data["choices"][0]["message"]["content"]
    tokens_used = data.get("usage", {}).get("total_tokens", 0)

    if is_first_message:
        try:
            texto_limpio = raw_content.strip()
            texto_limpio = texto_limpio.replace("```json", "").replace("```", "")
            inicio = texto_limpio.find("{")
            fin = texto_limpio.rfind("}") + 1
            if inicio != -1 and fin > inicio:
                texto_limpio = texto_limpio[inicio:fin].strip()
            parsed = json.loads(texto_limpio)
            respuesta = parsed.get("response", "").strip()
            titulo = parsed.get("title", "").strip()
            if not respuesta:
                respuesta = raw_content.replace("**", "")
            if not titulo or titulo.lower() in ["sin título", "nueva conversación", "untitled", ""]:
                palabras = [p for p in raw_content.replace("**", "").split() if len(p) > 2][:5]
                titulo = " ".join(palabras).rstrip(".,;:") or "Nuevo proyecto"
            return {
                "response": respuesta.replace("**", ""),
                "title": titulo,
                "tokens_used": tokens_used
            }
        except (json.JSONDecodeError, IndexError, ValueError):
            palabras = [p for p in raw_content.replace("**", "").split() if len(p) > 2][:5]
            titulo_fallback = " ".join(palabras).rstrip(".,;:") or "Nuevo proyecto"
            return {
                "response": raw_content.replace("**", ""),
                "title": titulo_fallback,
                "tokens_used": tokens_used
            }

    return {
        "response": raw_content.replace("**", ""),
        "title": None,
        "tokens_used": tokens_used
    }


def send_image_message(image_url, historial=None):
    """
    función legacy — mantenida por compatibilidad.
    la visión real ahora pasa por image_service.py con claude haiku.
    """
    return {
        "response": "No pude analizar la imagen en este momento.",
        "tokens_used": 0
    }