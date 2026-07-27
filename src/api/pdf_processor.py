import PyPDF2
import traceback
from io import BytesIO
from sentence_transformers import SentenceTransformer
from api.models import db, Manual, ManualChunk

# cargo el modelo de embeddings una sola vez al arrancar
embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')


def extraer_y_trocear_pdf(pdf_content, manual_id):
    """
    extrae texto del pdf, lo trocea en fragmentos,
    genera embeddings y guarda todo en la bd
    """
    manual = Manual.query.get(manual_id)

    try:
        # leo el pdf
        pdf_file = BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)

        # extraigo todo el texto pagina a pagina
        texto_completo = ""
        for page_num, page in enumerate(reader.pages):
            texto = page.extract_text()
            if texto:
                texto_completo += f"\n--- Página {page_num + 1} ---\n" + texto

        # trozo el texto en fragmentos de aprox 200 palabras
        palabras = texto_completo.split()
        tamanio_chunk = 200
        chunks = []

        for i in range(0, len(palabras), tamanio_chunk):
            chunk_palabras = palabras[i:i + tamanio_chunk]
            chunk_texto = " ".join(chunk_palabras)
            chunks.append(chunk_texto)

        # genero embedding y guardo cada chunk en la bd
        for chunk_index, chunk_texto in enumerate(chunks):
            embedding = embeddings_model.encode(chunk_texto).tolist()

            manual_chunk = ManualChunk(
                manual_id=manual_id,
                content=chunk_texto,
                page_number=None,
                chunk_index=chunk_index,
                embedding=embedding
            )
            db.session.add(manual_chunk)

        # marco el manual como listo
        manual.status = "listo"
        manual.total_chunks = len(chunks)
        db.session.commit()

        print(f"manual {manual_id} procesado: {len(chunks)} chunks con embeddings creados")

    except Exception as err:
        # si algo falla marco el manual como error
        traceback.print_exc()
        manual.status = "error"
        db.session.commit()
        print(f"error procesando manual {manual_id}: {err}")