from api.models import Project, Manual, ManualMetadata, ChatHistory
from api.knowledge_service import buscar_chunks_relevantes, construir_contexto

# palabras que indican referencia al contexto anterior
REFERENCIAS_CONVERSACIONALES = [
    "ese", "eso", "el mismo", "la misma", "ese manual", "ese mueble",
    "el que te he adjuntado", "el que subí", "el que te envié",
    "continúa", "continua", "sigue", "siguiente", "¿y ahora?", "y ahora",
    "¿qué hago?", "qué hago", "¿qué sigue?", "qué sigue",
    "después", "luego", "a continuación", "el anterior", "lo anterior",
    "¿y después?", "y después", "¿qué más?", "qué más",
    "qué es", "qué hay", "qué tiene", "qué contiene", "qué dice"
]

KEYWORDS_HERRAMIENTAS = ["herramienta", "herramientas", "necesito", "qué necesito", "qué hace falta"]
KEYWORDS_PIEZAS = ["pieza", "piezas", "componente", "componentes", "parte", "partes", "qué viene"]
KEYWORDS_TORNILLERIA = ["tornillo", "tornillos", "tuerca", "tuercas", "anclaje", "clavo", "fijación"]
KEYWORDS_PASOS = ["cuántos pasos", "número de pasos", "pasos tiene", "cuánto dura", "tiempo"]
KEYWORDS_DIFICULTAD = ["difícil", "dificultad", "nivel", "complicado", "fácil"]


def es_referencia_conversacional(mensaje):
    """detecta si el mensaje hace referencia a algo anterior sin contenido nuevo"""
    mensaje_lower = mensaje.lower().strip()
    if len(mensaje_lower.split()) <= 4:
        for ref in REFERENCIAS_CONVERSACIONALES:
            if ref in mensaje_lower:
                return True
    for ref in REFERENCIAS_CONVERSACIONALES:
        if mensaje_lower == ref:
            return True
    return False


def detectar_tipo_pregunta(mensaje):
    """detecta qué tipo de información busca el usuario para consultar metadata primero"""
    mensaje_lower = mensaje.lower()
    if any(k in mensaje_lower for k in KEYWORDS_HERRAMIENTAS):
        return "herramientas"
    if any(k in mensaje_lower for k in KEYWORDS_PIEZAS):
        return "piezas"
    if any(k in mensaje_lower for k in KEYWORDS_TORNILLERIA):
        return "tornilleria"
    if any(k in mensaje_lower for k in KEYWORDS_PASOS):
        return "pasos"
    if any(k in mensaje_lower for k in KEYWORDS_DIFICULTAD):
        return "dificultad"
    return None


def construir_consulta_enriquecida(user_message, historial, manual):
    """enriquece la consulta rag con el contexto conversacional reciente"""
    partes = []
    mensajes_usuario = [m["content"] for m in historial if m["role"] == "user"][-3:]
    if mensajes_usuario:
        partes.append(" ".join(mensajes_usuario))
    partes.append(user_message)
    if manual:
        partes.append(manual.original_filename.replace(".pdf", "").replace("-", " "))
    return " ".join(partes)


def construir_contexto_metadata(metadata, tipo_pregunta):
    """construye contexto desde metadata estructurada para preguntas frecuentes"""
    if not metadata:
        return None

    if tipo_pregunta == "herramientas" and metadata.tools_required:
        lineas = ["Herramientas necesarias según el manual:"]
        for tool in metadata.tools_required:
            lineas.append(f"- {tool}")
        return "\n".join(lineas)

    if tipo_pregunta == "piezas" and metadata.parts_list:
        lineas = ["Piezas principales según el manual:"]
        for part in metadata.parts_list:
            lineas.append(f"- {part}")
        return "\n".join(lineas)

    if tipo_pregunta == "tornilleria" and metadata.hardware_list:
        lineas = ["Tornillería según el manual:"]
        for item in metadata.hardware_list:
            lineas.append(f"- {item}")
        return "\n".join(lineas)

    if tipo_pregunta == "pasos" and metadata.total_steps:
        return f"Número total de pasos según el manual: {metadata.total_steps}"

    if tipo_pregunta == "dificultad" and metadata.difficulty:
        lineas = [f"Nivel de dificultad: {metadata.difficulty}"]
        if metadata.estimated_time:
            lineas.append(f"Tiempo estimado: {metadata.estimated_time}")
        return "\n".join(lineas)

    return None


def construir_contexto_conversacion(project_id, user_message, historial_groq):
    """
    cerebro de gia: construye el contexto completo antes de cada respuesta

    flujo:
    1. contexto conversacional
    2. proyecto activo
    3. metadata estructurada
    4. rag
    5. conocimiento general (solo groq)
    """
    resultado = {
        "proyecto": None,
        "manual": None,
        "metadata": None,
        "tiene_manual": False,
        "contexto_rag": None,
        "consulta_rag": None,
        "info_proyecto": None,
        "tipo_pregunta": None,
    }

    proyecto = Project.query.get(project_id)
    if not proyecto:
        return resultado

    resultado["proyecto"] = proyecto
    resultado["info_proyecto"] = {
        "titulo": proyecto.title or "Montaje sin título",
        "estado": proyecto.status,
    }

    # busco el manual más reciente del proyecto en estado listo
    manual = Manual.query.filter_by(
        project_id=project_id,
        status="listo"
    ).order_by(Manual.created_at.desc()).first()

    # si no hay manual listo, busco cualquier manual del proyecto
    if not manual:
        manual = Manual.query.filter_by(
            project_id=project_id
        ).order_by(Manual.created_at.desc()).first()

    if not manual:
        return resultado

    resultado["tiene_manual"] = True
    resultado["manual"] = manual

    print(f"=== CONTEXT: manual encontrado: id={manual.id} project={project_id} status={manual.status} chunks={manual.total_chunks} ===")

    # busco metadata estructurada
    metadata = ManualMetadata.query.filter_by(manual_id=manual.id).first()
    resultado["metadata"] = metadata

    tipo_pregunta = detectar_tipo_pregunta(user_message)
    resultado["tipo_pregunta"] = tipo_pregunta

    # si es pregunta sobre metadata, la consulto directamente sin rag
    if tipo_pregunta and metadata:
        contexto_metadata = construir_contexto_metadata(metadata, tipo_pregunta)
        if contexto_metadata:
            resultado["contexto_rag"] = contexto_metadata
            print(f"=== CONTEXT: usando metadata para tipo={tipo_pregunta} ===")
            return resultado

    # enriquezco la consulta rag si es referencia conversacional
    if es_referencia_conversacional(user_message):
        consulta = construir_consulta_enriquecida(user_message, historial_groq, manual)
        print(f"=== CONTEXT: consulta enriquecida: {consulta[:100]} ===")
    else:
        consulta = user_message

    resultado["consulta_rag"] = consulta

    # ejecuto rag
    chunks = buscar_chunks_relevantes(consulta, manual.id)
    resultado["contexto_rag"] = construir_contexto(chunks)

    print(f"=== CONTEXT: rag devolvió {len(chunks) if chunks else 0} chunks ===")

    return resultado


def construir_info_manual_para_groq(contexto):
    """
    construye el contexto completo del proyecto y manual para groq
    groq siempre sabe qué proyecto está activo y qué información tiene
    """
    if not contexto["tiene_manual"]:
        return None

    manual = contexto["manual"]
    proyecto = contexto["info_proyecto"]
    metadata = contexto["metadata"]

    lineas = [
        f"Proyecto activo: {proyecto['titulo']}",
        f"Manual disponible: procesado y listo para consulta",
        f"Fragmentos indexados: {manual.total_chunks}",
    ]

    if metadata:
        if metadata.difficulty:
            lineas.append(f"Dificultad del montaje: {metadata.difficulty}")
        if metadata.estimated_time:
            lineas.append(f"Tiempo estimado: {metadata.estimated_time} minutos")
        if metadata.total_steps:
            lineas.append(f"Número de pasos: {metadata.total_steps}")
        if metadata.tools_required:
            tools = ", ".join(metadata.tools_required[:5])
            lineas.append(f"Herramientas necesarias: {tools}")
        if metadata.safety_warnings:
            warnings = "; ".join(str(w) for w in metadata.safety_warnings[:2])
            lineas.append(f"Advertencias: {warnings}")

    return "\n".join(lineas)