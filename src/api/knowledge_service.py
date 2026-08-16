from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import or_
from api.models import ManualChunk

# carga lazy para que flask arranque aunque torch/numpy estén rotos
try:
    from sentence_transformers import SentenceTransformer
    modelo = SentenceTransformer('all-MiniLM-L6-v2')
    print("=== KNOWLEDGE: modelo cargado correctamente ===")
except Exception as e:
    modelo = None
    print(f"=== KNOWLEDGE: SentenceTransformer no disponible — {e} ===")


def generar_embedding(texto):
    """
    convierte un texto en un vector de numeros que representa su significado.
    dos textos con significado similar tendran vectores muy parecidos.
    """
    if modelo is None:
        return []
    return modelo.encode(texto).tolist()


def _fallback_textual(pregunta, manual_id, top_k=5):
    """
    fallback cuando SentenceTransformer no está disponible.
    busca chunks por coincidencia textual de términos usando ILIKE.
    filtra siempre por manual_id — nunca mezcla manuales.
    nunca devuelve los primeros chunks por posición.
    devuelve lista vacía si no encuentra nada relevante.
    """
    palabras_vacias = {
        "qué", "que", "cómo", "como", "cuál", "cual", "cuánto", "cuanto",
        "el", "la", "los", "las", "un", "una", "unos", "unas",
        "de", "del", "en", "con", "por", "para", "a", "y", "o",
        "es", "son", "está", "están", "hay", "hago", "hacer",
        "me", "te", "se", "le", "lo", "al", "mi", "tu",
        "ahora", "paso", "siguiente", "debo", "puedo", "tengo"
    }

    terminos = [
        t.strip("¿?.,;:()[]").lower()
        for t in pregunta.split()
        if len(t.strip("¿?.,;:()[]")) >= 3
        and t.strip("¿?.,;:()[]").lower() not in palabras_vacias
    ]

    if not terminos:
        print("=== KNOWLEDGE FALLBACK: sin términos útiles — devuelvo vacío ===")
        return []

    filtros = [
        ManualChunk.content.ilike(f"%{termino}%")
        for termino in terminos
    ]

    chunks = ManualChunk.query.filter(
        ManualChunk.manual_id == manual_id,
        or_(*filtros)
    ).all()

    if not chunks:
        print(f"=== KNOWLEDGE FALLBACK: sin resultados para términos {terminos} ===")
        return []

    def puntuar(chunk):
        contenido = chunk.content.lower()
        return sum(1 for t in terminos if t in contenido)

    chunks_puntuados = [(chunk, puntuar(chunk)) for chunk in chunks]
    chunks_puntuados.sort(key=lambda x: x[1], reverse=True)

    vistos = set()
    resultado = []
    for chunk, puntuacion in chunks_puntuados:
        clave = chunk.content[:100]
        if clave not in vistos and puntuacion > 0:
            vistos.add(clave)
            resultado.append(chunk)
        if len(resultado) >= top_k:
            break

    print(f"=== KNOWLEDGE FALLBACK: {len(resultado)} chunks por búsqueda textual (términos: {terminos}) ===")
    return resultado


def buscar_chunks_relevantes(pregunta, manual_id, top_k=5, umbral=0.3):
    """
    busca los fragmentos del manual más relevantes para una pregunta concreta.

    flujo:
    - semántica disponible → búsqueda semántica con cosine similarity
    - semántica no disponible → fallback textual con ILIKE
    - nunca devuelve primeros chunks por posición
    """
    # semántica no disponible → fallback textual
    if modelo is None:
        print("=== KNOWLEDGE: semántica no disponible → fallback textual ===")
        return _fallback_textual(pregunta, manual_id, top_k)

    embedding_pregunta = generar_embedding(pregunta)

    chunks = ManualChunk.query.filter_by(manual_id=manual_id).filter(
        ManualChunk.embedding.isnot(None)
    ).all()

    if not chunks:
        print("=== KNOWLEDGE: sin chunks con embedding → fallback textual ===")
        return _fallback_textual(pregunta, manual_id, top_k)

    similitudes = []
    for chunk in chunks:
        if not chunk.embedding:
            continue
        sim = cosine_similarity([embedding_pregunta], [chunk.embedding])[0][0]
        if sim >= umbral:
            similitudes.append((chunk, float(sim)))

    if not similitudes:
        print("=== KNOWLEDGE: similitud por debajo del umbral → fallback textual ===")
        return _fallback_textual(pregunta, manual_id, top_k)

    similitudes.sort(key=lambda x: x[1], reverse=True)
    resultado = [chunk for chunk, _ in similitudes[:top_k]]
    print(f"=== KNOWLEDGE: {len(resultado)} chunks semánticos (manual_id={manual_id}) ===")
    return resultado


def construir_contexto(chunks):
    """
    une los fragmentos relevantes en un texto de contexto para groq.
    cada fragmento se separa con una línea para que groq los lea bien.
    """
    if not chunks:
        return None

    partes = []
    for i, chunk in enumerate(chunks, 1):
        partes.append(f"[Fragmento {i}]\n{chunk.content}")

    return "\n\n".join(partes)