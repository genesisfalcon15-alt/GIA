from api.models import Project, Manual, ManualMetadata, ChatHistory, UserProfile
from api.knowledge_service import buscar_chunks_relevantes, construir_contexto
from sqlalchemy import or_

REFERENCIAS_CONVERSACIONALES = [
    "ese", "eso", "el mismo", "la misma", "ese manual", "ese mueble",
    "el que te he adjuntado", "el que subí", "el que te envié",
    "continúa", "continua", "sigue", "siguiente", "¿y ahora?", "y ahora",
    "¿qué hago?", "qué hago", "¿qué sigue?", "qué sigue",
    "después", "luego", "a continuación", "el anterior", "lo anterior",
    "¿y después?", "y después", "¿qué más?", "qué más",
    "qué es", "qué hay", "qué tiene", "qué contiene", "qué dice"
]

REFERENCIAS_PROYECTOS_ANTERIORES = [
    "recuerdas", "recuerda", "el otro día", "la semana pasada", "antes",
    "el proyecto", "aquella vez", "cuando monté", "cuando instalé",
    "cuando reparé", "el armario que", "la cama que", "la mesa que",
    "el sofá que", "la lámpara que", "el mueble que", "aquel",
    "aquella", "los tornillos de", "las herramientas de", "qué usé en",
    "qué tornillos", "qué tacos", "qué broca", "qué llave allen"
]

PALABRAS_NIVEL_PRINCIPIANTE = [
    "paso a paso", "con detalle", "no sé", "no entiendo", "explícame",
    "nunca he montado", "es mi primera vez", "principiante", "despacio"
]
PALABRAS_NIVEL_INTERMEDIO = [
    "normal", "a ritmo normal", "intermedio", "algo de experiencia"
]
PALABRAS_NIVEL_EXPERTO = [
    "directo", "rápido", "sin explicaciones", "experto", "ya sé", "lo llevo yo",
    "soy profesional", "tengo experiencia", "lo hago solo"
]

KEYWORDS_HERRAMIENTAS = ["herramienta", "herramientas", "necesito", "qué necesito", "qué hace falta"]
KEYWORDS_PIEZAS = ["pieza", "piezas", "componente", "componentes", "parte", "partes", "qué viene"]
KEYWORDS_TORNILLERIA = ["tornillo", "tornillos", "tuerca", "tuercas", "anclaje", "clavo", "fijación"]
KEYWORDS_PASOS = ["cuántos pasos", "número de pasos", "pasos tiene", "cuánto dura", "tiempo"]
KEYWORDS_DIFICULTAD = ["difícil", "dificultad", "nivel", "complicado", "fácil"]


def detectar_nivel_asistencia(mensaje):
    mensaje_lower = mensaje.lower()
    if any(p in mensaje_lower for p in PALABRAS_NIVEL_EXPERTO):
        return "experto"
    if any(p in mensaje_lower for p in PALABRAS_NIVEL_INTERMEDIO):
        return "intermedio"
    if any(p in mensaje_lower for p in PALABRAS_NIVEL_PRINCIPIANTE):
        return "principiante"
    return None


def es_referencia_conversacional(mensaje):
    mensaje_lower = mensaje.lower().strip()
    if len(mensaje_lower.split()) <= 4:
        for ref in REFERENCIAS_CONVERSACIONALES:
            if ref in mensaje_lower:
                return True
    for ref in REFERENCIAS_CONVERSACIONALES:
        if mensaje_lower == ref:
            return True
    return False


def es_referencia_proyecto_anterior(mensaje):
    mensaje_lower = mensaje.lower().strip()
    for ref in REFERENCIAS_PROYECTOS_ANTERIORES:
        if ref in mensaje_lower:
            return True
    return False


def detectar_tipo_pregunta(mensaje):
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
    partes = []
    mensajes_usuario = [m["content"] for m in historial if m["role"] == "user"][-3:]
    if mensajes_usuario:
        partes.append(" ".join(mensajes_usuario))
    partes.append(user_message)
    if manual:
        partes.append(manual.original_filename.replace(".pdf", "").replace("-", " "))
    return " ".join(partes)


def construir_contexto_metadata(metadata, tipo_pregunta):
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


def buscar_proyectos_anteriores(user_id, project_id_actual, limite=3):
    proyectos = Project.query.filter(
        Project.user_id == user_id,
        Project.id != project_id_actual,
        Project.title != None
    ).order_by(Project.created_at.desc()).limit(limite).all()

    if not proyectos:
        return None

    lineas = ["Proyectos anteriores del usuario:"]
    for p in proyectos:
        linea = f"- {p.title}"
        if p.status:
            linea += f" ({p.status})"
        manual = Manual.query.filter_by(
            project_id=p.id,
            status="listo"
        ).first()
        if manual:
            linea += f" — manual: {manual.original_filename}"
            metadata = ManualMetadata.query.filter_by(manual_id=manual.id).first()
            if metadata and metadata.tools_required:
                tools = ", ".join(metadata.tools_required[:3])
                linea += f" — herramientas usadas: {tools}"
        lineas.append(linea)

    print(f"=== CONTEXT: {len(proyectos)} proyectos anteriores encontrados ===")
    return "\n".join(lineas)


def construir_contexto_conversacion(project_id, user_message, historial_groq, user_id=None):
    """
    cerebro de gia: construye el contexto completo antes de cada respuesta.
    combina inventario estructurado + metadata + rag + historial + perfil.
    no hace return temprano — siempre construye el contexto completo.
    la consulta rag se enriquece con el paso actual si existe.
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
        "proyectos_anteriores": None,
        "nivel_asistencia": None,
        "paso_actual": None,
        "total_pasos": None,
        "perfil_usuario": None,
    }

    proyecto = Project.query.get(project_id)
    if not proyecto:
        return resultado

    resultado["proyecto"] = proyecto

    extra = proyecto.extra_data or {}
    resultado["nivel_asistencia"] = extra.get("nivel_asistencia", None)
    resultado["paso_actual"] = extra.get("current_step", None)
    resultado["total_pasos"] = extra.get("total_steps", None)

    nivel_detectado = detectar_nivel_asistencia(user_message)
    if nivel_detectado:
        resultado["nivel_asistencia"] = nivel_detectado
        print(f"=== CONTEXT: nivel de asistencia detectado → {nivel_detectado} ===")

    resultado["info_proyecto"] = {
        "titulo": proyecto.title or "Montaje sin título",
        "estado": proyecto.status,
        "nivel_asistencia": resultado["nivel_asistencia"],
        "paso_actual": resultado["paso_actual"],
        "total_pasos": resultado["total_pasos"],
    }

    # perfil del usuario
    if user_id:
        try:
            perfil = UserProfile.query.filter_by(user_id=user_id).first()
            if perfil:
                lineas_perfil = []
                if perfil.experience_level:
                    exp = ", ".join(perfil.experience_level) if isinstance(perfil.experience_level, list) else perfil.experience_level
                    lineas_perfil.append(f"Experiencia con bricolaje: {exp}")
                if perfil.tools_available:
                    tools = ", ".join(perfil.tools_available[:6])
                    lineas_perfil.append(f"Herramientas disponibles: {tools}")
                if perfil.interests:
                    intereses = ", ".join(perfil.interests[:4])
                    lineas_perfil.append(f"Intereses: {intereses}")
                if perfil.help_style:
                    lineas_perfil.append(f"Estilo de ayuda preferido: {perfil.help_style}")
                if lineas_perfil:
                    resultado["perfil_usuario"] = "\n".join(lineas_perfil)
                    print(f"=== CONTEXT: perfil de usuario cargado ===")
        except Exception as e:
            print(f"=== CONTEXT: error cargando perfil — {e} ===")

    if user_id and es_referencia_proyecto_anterior(user_message):
        contexto_anteriores = buscar_proyectos_anteriores(user_id, project_id)
        if contexto_anteriores:
            resultado["proyectos_anteriores"] = contexto_anteriores

    manual = Manual.query.filter_by(
        project_id=project_id,
        status="listo"
    ).order_by(Manual.created_at.desc()).first()

    if not manual:
        manual = Manual.query.filter_by(
            project_id=project_id
        ).order_by(Manual.created_at.desc()).first()

    if not manual:
        return resultado

    resultado["tiene_manual"] = True
    resultado["manual"] = manual

    print(f"=== CONTEXT: manual encontrado: id={manual.id} project={project_id} status={manual.status} chunks={manual.total_chunks} ===")

    metadata = ManualMetadata.query.filter_by(manual_id=manual.id).first()
    resultado["metadata"] = metadata

    tipo_pregunta = detectar_tipo_pregunta(user_message)
    resultado["tipo_pregunta"] = tipo_pregunta

    # acumulo contexto en partes — no hago return temprano
    partes_contexto = []

    # metadata específica solo si no existe inventario estructurado
    # el inventario tiene prioridad sobre metadata antigua
    tiene_inventario = metadata and metadata.components_inventory
    if tipo_pregunta and metadata and not tiene_inventario:
        contexto_metadata = construir_contexto_metadata(metadata, tipo_pregunta)
        if contexto_metadata:
            partes_contexto.append(contexto_metadata)
            print(f"=== CONTEXT: metadata antigua para tipo={tipo_pregunta} ===")

    # construyo la consulta rag
    if es_referencia_conversacional(user_message):
        consulta = construir_consulta_enriquecida(user_message, historial_groq, manual)
    else:
        consulta = user_message

    # enriquezco la consulta con el paso actual si existe
    # el paso no sustituye la consulta — la complementa
    paso_actual = resultado.get("paso_actual")
    if paso_actual:
        consulta = f"paso {paso_actual} {consulta}"
        print(f"=== CONTEXT: consulta RAG enriquecida con paso {paso_actual} ===")

    resultado["consulta_rag"] = consulta

    # rag — siempre se ejecuta para recuperar instrucciones del manual
    # si semántica no disponible → fallback textual automático en knowledge_service
    chunks = buscar_chunks_relevantes(consulta, manual.id)
    contexto_rag = construir_contexto(chunks)
    if contexto_rag:
        partes_contexto.append(contexto_rag)

    print(f"=== CONTEXT: rag devolvió {len(chunks) if chunks else 0} chunks ===")

    # combino todo el contexto
    resultado["contexto_rag"] = "\n\n".join(partes_contexto) if partes_contexto else None

    return resultado


def construir_info_manual_para_groq(contexto):
    """
    construye el contexto completo del proyecto para groq.
    prioridad: inventario estructurado > metadata antigua > rag.
    """
    if not contexto["tiene_manual"] and not contexto.get("proyectos_anteriores") and not contexto.get("perfil_usuario"):
        return None

    lineas = []

    # perfil del usuario
    if contexto.get("perfil_usuario"):
        lineas.append("# PERFIL DEL USUARIO")
        lineas.append(contexto["perfil_usuario"])
        lineas.append("")

    if contexto["tiene_manual"]:
        manual = contexto["manual"]
        proyecto = contexto["info_proyecto"]
        metadata = contexto["metadata"]

        lineas += [
            f"Proyecto activo: {proyecto['titulo']}",
            f"Manual disponible: procesado y listo para consulta",
            f"Fragmentos indexados: {manual.total_chunks}",
        ]

        if proyecto.get("nivel_asistencia"):
            lineas.append(f"Nivel de asistencia del usuario: {proyecto['nivel_asistencia']}")

        if proyecto.get("paso_actual") and proyecto.get("total_pasos"):
            lineas.append(f"Último paso registrado: {proyecto['paso_actual']} de {proyecto['total_pasos']}")

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

            # inventario estructurado — prioridad absoluta
            if metadata.components_inventory:
                inv = metadata.components_inventory
                lineas.append("")
                lineas.append("# INVENTARIO ESTRUCTURADO DEL PRODUCTO")
                lineas.append("Fuente de verdad para identificar piezas, herrajes, cantidades y relaciones.")
                lineas.append("El RAG aporta instrucciones del paso pero NO puede contradecir estas identificaciones.")

                piezas_confirmadas = [
                    p for p in inv.get("piezas", [])
                    if "confirmado" in p.get("confianza", "")
                ]
                if piezas_confirmadas:
                    lineas.append("IDENTIFICACIONES CONFIRMADAS — PIEZAS:")
                    for p in piezas_confirmadas:
                        linea = f"  Pieza {p['id']}: {p.get('descripcion', 'sin descripción')}"
                        if p.get("cantidad"):
                            linea += f" × {p['cantidad']}"
                        if p.get("dimensiones"):
                            linea += f" ({p['dimensiones']})"
                        lineas.append(linea)

                herrajes_confirmados = [
                    h for h in inv.get("herrajes", [])
                    if "confirmado" in h.get("confianza", "")
                ]
                if herrajes_confirmados:
                    lineas.append("IDENTIFICACIONES CONFIRMADAS — HERRAJES:")
                    for h in herrajes_confirmados:
                        linea = f"  {h['letra']} = {h.get('tipo', 'componente')}"
                        if h.get("descripcion"):
                            linea += f" ({h['descripcion']})"
                        if h.get("cantidad"):
                            linea += f" × {h['cantidad']}"
                        if h.get("dimensiones"):
                            linea += f" — {h['dimensiones']}"
                        lineas.append(linea)

                relaciones = inv.get("relaciones", [])
                if relaciones:
                    lineas.append("RELACIONES POR PASO:")
                    for r in relaciones:
                        piezas_str = " + ".join([f"pieza {p}" for p in r.get("piezas", [])])
                        herrajes_str = ", ".join([
                            f"{h['letra']} × {h.get('cantidad', '?')}"
                            for h in r.get("herrajes", [])
                        ])
                        linea = f"  Paso {r.get('paso', '?')}: {piezas_str}"
                        if herrajes_str:
                            linea += f" → {herrajes_str}"
                        lineas.append(linea)

                no_confirmados = inv.get("no_confirmados", [])
                if no_confirmados:
                    lineas.append("IDENTIFICACIONES PRESENTES PERO NO CONFIRMADAS:")
                    lineas.append(f"  {', '.join(str(x) for x in no_confirmados)}")
                    lineas.append("  GIA sabe que existen pero NO puede afirmar qué son.")
                    lineas.append("  Si el usuario pregunta: 'El manual no confirma qué corresponde a [X].'")

            else:
                # manual antiguo sin inventario — usa parts_list y hardware_list
                print(f"=== CONTEXT: manual sin inventario estructurado — usando metadata legacy ===")
                if metadata.parts_list:
                    partes = ", ".join(str(p) for p in metadata.parts_list[:8])
                    lineas.append(f"Piezas identificadas: {partes}")
                if metadata.hardware_list:
                    herrajes = ", ".join(str(h) for h in metadata.hardware_list[:8])
                    lineas.append(f"Herrajes identificados: {herrajes}")

    if contexto.get("proyectos_anteriores"):
        lineas.append("")
        lineas.append(contexto["proyectos_anteriores"])

    return "\n".join(lineas) if lineas else None