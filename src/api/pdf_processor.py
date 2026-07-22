import PyPDF2
from io import BytesIO
from api.models import db, Manual, ManualChunk

# aqui metemos las librerias para embeddings despues
# de momento solo trocamos el pdf

def extraer_y_trocear_pdf(pdf_content, manual_id):
    """
    extrae texto del pdf, lo trocea en fragmentos
    y guarda todo en la bd
    
    pdf_content: el contenido binario del pdf
    manual_id: id del manual en la bd
    """
    try:
        # leo el pdf
        pdf_file = BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)
        
        # extraigo todo el texto de todas las paginas
        texto_completo = ""
        for page_num, page in enumerate(reader.pages):
            texto = page.extract_text()
            if texto:
                texto_completo += f"\n--- Página {page_num + 1} ---\n" + texto
        
        # trozo el texto en fragmentos de aprox 500 tokens (150-200 palabras)
        palabras = texto_completo.split()
        tamanio_chunk = 200  # aprox 500 tokens
        chunks = []
        
        for i in range(0, len(palabras), tamanio_chunk):
            chunk_palabras = palabras[i:i + tamanio_chunk]
            chunk_texto = " ".join(chunk_palabras)
            chunks.append(chunk_texto)
        
        # guardo cada chunk en la bd
        manual = Manual.query.get(manual_id)
        
        for chunk_index, chunk_texto in enumerate(chunks):
            # TODO: generar embedding aqui
            # por ahora solo guardamos el texto
            
            manual_chunk = ManualChunk(
                manual_id=manual_id,
                content=chunk_texto,
                page_number=None,  # lo calculamos despues si hace falta
                chunk_index=chunk_index,
                embedding=None  # TODO: embedding
            )
            
            db.session.add(manual_chunk)
        
        # actualizo el manual con el total de chunks
        manual.status = "listo"
        manual.total_chunks = len(chunks)
        db.session.commit()
        
        print(f"manual {manual_id} procesado: {len(chunks)} chunks creados")
        
    except Exception as err:
        # si algo falla, marco el manual como error
        manual = Manual.query.get(manual_id)
        manual.status = "error"
        db.session.commit()
        print(f"error procesando manual {manual_id}: {err}")