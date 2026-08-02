import PyPDF2
import traceback
import json
import requests
import os
from io import BytesIO
from sentence_transformers import SentenceTransformer
from api.models import db, Manual, ManualChunk, ManualMetadata

embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')


def extraer_metadata_con_groq(texto_completo):
    """
    extrae metadata estructurada del manual usando groq
    si falla devuelve None sin detener el procesamiento principal
    """
    try:
        texto_muestra = texto_completo[:3000]

        if len(texto_muestra.strip()) < 100:
            print("=== METADATA: texto insuficiente ===")
            return None

        prompt = f"""Analiza este fragmento de un manual de montaje y extrae información estructurada.
Si un campo no aparece en el texto, usa null.
Responde ÚNICAMENTE con JSON válido, sin texto antes ni después.

Texto del manual:
{texto_muestra}

JSON esperado:
{{
  "tools_required": ["herramientas mencionadas"],
  "parts_list": ["piezas o componentes mencionados"],
  "hardware_list": ["tornillos, tuercas, anclajes mencionados"],
  "total_steps": null,
  "safety_warnings": ["advertencias de seguridad mencionadas"],
  "estimated_time": null,
  "difficulty": "facil"
}}"""

        print(f"=== METADATA: enviando {len(texto_muestra)} caracteres a groq ===")

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('GROQ_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 800
            },
            timeout=30
        )

        if response.status_code != 200:
            print(f"=== METADATA: error de groq {response.status_code} ===")
            return None

        raw = response.json()["choices"][0]["message"]["content"]
        print(f"=== METADATA: respuesta de groq: {raw[:300]} ===")

        inicio = raw.find("{")
        fin = raw.rfind("}") + 1
        if inicio == -1 or fin <= inicio:
            print("=== METADATA: groq no devolvió JSON válido ===")
            return None

        parsed = json.loads(raw[inicio:fin])
        print(f"=== METADATA: extraída: {list(parsed.keys())} ===")
        return parsed

    except Exception as e:
        print(f"=== METADATA: error: {e} ===")
        traceback.print_exc()
        return None


def extraer_y_trocear_pdf(pdf_content, manual_id):
    """
    flujo completo de procesamiento del pdf:
    1. extrae texto
    2. genera chunks y embeddings → commit inmediato
    3. intenta extraer metadata con groq (opcional, no bloquea)
    4. marca manual como listo
    """
    manual = Manual.query.get(manual_id)

    try:
        # extraigo texto del pdf pagina a pagina
        pdf_file = BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)

        texto_completo = ""
        for page_num, page in enumerate(reader.pages):
            texto = page.extract_text()
            if texto:
                texto_completo += f"\n--- Página {page_num + 1} ---\n" + texto

        print(f"=== PDF: {len(reader.pages)} páginas, {len(texto_completo)} caracteres ===")
        print(f"=== PDF: primeros 500 chars: {texto_completo[:500]} ===")

        if not texto_completo.strip():
            raise Exception("el pdf no contiene texto — puede ser un pdf escaneado")

        # trozo en chunks de aprox 200 palabras
        palabras = texto_completo.split()
        tamanio_chunk = 200
        chunks = []

        for i in range(0, len(palabras), tamanio_chunk):
            chunk_texto = " ".join(palabras[i:i + tamanio_chunk])
            chunks.append(chunk_texto)

        # genero embeddings y añado chunks a la sesión
        for chunk_index, chunk_texto in enumerate(chunks):
            embedding = embeddings_model.encode(chunk_texto).tolist()
            db.session.add(ManualChunk(
                manual_id=manual_id,
                content=chunk_texto,
                page_number=None,
                chunk_index=chunk_index,
                embedding=embedding
            ))

        # commit de chunks ANTES de llamar a groq para metadata
        # si groq falla después, los chunks ya están en postgresql y el rag funciona
        manual.total_chunks = len(chunks)
        db.session.commit()
        print(f"=== CHUNKS: {len(chunks)} guardados en BD ===")

        # extracción de metadata con groq — opcional, no bloquea el flujo
        print(f"=== METADATA: iniciando extracción para manual {manual_id} ===")
        metadata_data = extraer_metadata_con_groq(texto_completo)

        if metadata_data:
            # verifico que no existe ya metadata para este manual
            existing = ManualMetadata.query.filter_by(manual_id=manual_id).first()
            if not existing:
                db.session.add(ManualMetadata(
                    manual_id=manual_id,
                    tools_required=metadata_data.get("tools_required"),
                    parts_list=metadata_data.get("parts_list"),
                    hardware_list=metadata_data.get("hardware_list"),
                    total_steps=metadata_data.get("total_steps"),
                    safety_warnings=metadata_data.get("safety_warnings"),
                    estimated_time=metadata_data.get("estimated_time"),
                    difficulty=metadata_data.get("difficulty"),
                ))
                print("=== METADATA: guardada en BD ===")
        else:
            print("=== METADATA: no extraída, el rag sigue funcionando con los chunks ===")

        # marco el manual como listo aunque la metadata haya fallado
        # los chunks son suficientes para que el rag funcione
        manual.status = "listo"
        db.session.commit()
        print(f"=== MANUAL {manual_id}: listo con {len(chunks)} chunks ===")

    except Exception as err:
        traceback.print_exc()
        manual.status = "error"
        db.session.commit()
        print(f"=== MANUAL {manual_id}: error crítico: {err} ===")
        raise