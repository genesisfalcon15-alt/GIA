from sklearn.metrics.pairwise import cosine_similarity
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
    convierte un texto en un vector de numeros que representa su significado
    dos textos con significado similar tendran vectores muy parecidos
    """
    if modelo is None:
        return []
    return modelo.encode(texto).tolist()


def buscar_chunks_relevantes(pregunta, manual_id, top_k=5, umbral=0.3):
    """
    busca los fragmentos del manual mas relevantes para una pregunta concreta

    pregunta: lo que acaba de preguntar el usuario
    manual_id: id del manual donde buscamos
    top_k: cuantos fragmentos devolvemos como maximo
    umbral: similitud minima para considerar un fragmento relevante (0 a 1)
    """
    # si el modelo no está disponible devuelvo todos los chunks sin filtrar
    if modelo is None:
        chunks = ManualChunk.query.filter_by(manual_id=manual_id).limit(top_k).all()
        return chunks

    # genero el embedding de la pregunta del usuario
    embedding_pregunta = generar_embedding(pregunta)

    # traigo todos los chunks del manual que tengan embedding generado
    chunks = ManualChunk.query.filter_by(manual_id=manual_id).filter(
        ManualChunk.embedding.isnot(None)
    ).all()

    # si no hay chunks con embedding devuelvo lista vacia
    if not chunks:
        return []

    # calculo la similitud coseno entre la pregunta y cada fragmento
    # la similitud coseno mide el angulo entre dos vectores
    # 1 = identicos, 0 = sin relacion, -1 = opuestos
    similitudes = []
    for chunk in chunks:
        if not chunk.embedding:
            continue
        sim = cosine_similarity([embedding_pregunta], [chunk.embedding])[0][0]
        if sim >= umbral:
            similitudes.append((chunk, float(sim)))

    # ordeno de mayor a menor similitud y devuelvo los top_k mejores
    similitudes.sort(key=lambda x: x[1], reverse=True)
    return [chunk for chunk, _ in similitudes[:top_k]]


def construir_contexto(chunks):
    """
    une los fragmentos relevantes en un texto de contexto para groq
    cada fragmento se separa con una linea para que groq los lea bien
    """
    if not chunks:
        return None

    partes = []
    for i, chunk in enumerate(chunks, 1):
        partes.append(f"[Fragmento {i}]\n{chunk.content}")

    return "\n\n".join(partes)