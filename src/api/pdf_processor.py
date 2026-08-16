import PyPDF2
import traceback
import json
import requests
import os
import base64
import anthropic
from io import BytesIO
from api.models import db, Manual, ManualChunk, ManualMetadata

# carga lazy para que flask arranque aunque torch/numpy estén rotos
try:
    from sentence_transformers import SentenceTransformer
    embeddings_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("=== EMBEDDINGS: modelo cargado correctamente ===")
except Exception as e:
    embeddings_model = None
    print(f"=== EMBEDDINGS: SentenceTransformer no disponible — {e} ===")


def extraer_metadata_con_groq(texto_completo):
    """
    extrae metadata estructurada del manual usando groq.
    si falla devuelve None sin detener el procesamiento principal.
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
        inicio = raw.find("{")
        fin = raw.rfind("}") + 1
        if inicio == -1 or fin <= inicio:
            return None

        parsed = json.loads(raw[inicio:fin])
        print(f"=== METADATA: extraída: {list(parsed.keys())} ===")
        return parsed

    except Exception as e:
        print(f"=== METADATA: error: {e} ===")
        return None


def rasterizar_paginas(pdf_content):
    """
    convierte páginas del pdf a imágenes base64 usando PyMuPDF (fitz).
    devuelve lista de {"pagina": N, "imagen_b64": "..."}.
    si fitz no está disponible devuelve lista vacía.
    """
    try:
        import fitz  # PyMuPDF
        paginas = []
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        for num, pagina in enumerate(doc):
            # resolución 150 DPI — suficiente para identificar letras y números
            mat = fitz.Matrix(150 / 72, 150 / 72)
            pix = pagina.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
            img_bytes = pix.tobytes("png")
            img_b64 = base64.standard_b64encode(img_bytes).decode("utf-8")
            paginas.append({"pagina": num + 1, "imagen_b64": img_b64})
        doc.close()
        print(f"=== VISION: {len(paginas)} páginas rasterizadas ===")
        return paginas
    except ImportError:
        print("=== VISION: PyMuPDF no disponible — análisis solo texto ===")
        return []
    except Exception as e:
        print(f"=== VISION: error rasterizando — {e} ===")
        return []


def extraer_inventario_con_vision(texto_completo, paginas_imagenes):
    """
    extrae el inventario estructurado del manual usando Claude Haiku.
    combina texto completo + imágenes de todas las páginas en una sola llamada.
    devuelve dict con piezas, herrajes, relaciones o None si falla.

    regla crítica: solo incluye elementos que aparecen claramente en el manual.
    nunca inventa identificaciones. si no está confirmado, usa confianza "no_confirmado".
    """
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        prompt_sistema = """Eres un sistema de análisis de manuales de montaje.
Tu única tarea es identificar con precisión los componentes del producto a partir del manual.

REGLA ABSOLUTA: Solo incluyes información que aparezca claramente en el manual.
NUNCA inventes piezas, letras, cantidades o relaciones.
NUNCA asumas lo que "suele tener" un mueble de este tipo.
Si no puedes confirmar una identificación con evidencia del manual: usa confianza "no_confirmado".

Para cada elemento que identifies, indica la fuente:
- "confirmado_manual_texto" — aparece claramente en texto
- "confirmado_manual_visual" — aparece claramente en imagen/diagrama
- "confirmado_manual_texto_y_visual" — aparece en ambos
- "no_confirmado" — inferido, no confirmado directamente

Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después. Sin bloques de código."""

        # construyo el contenido multimodal — texto + todas las imágenes
        contenido = []

        # texto completo del manual
        contenido.append({
            "type": "text",
            "text": f"""Analiza este manual de montaje y extrae el inventario completo de componentes.

TEXTO EXTRAÍDO DEL MANUAL:
{texto_completo[:8000]}

INSTRUCCIÓN: Analiza también las imágenes adjuntas de cada página para identificar:
- Números de pieza y sus descripciones
- Letras de herrajes (A, B, C, J...) y qué son exactamente
- Cantidades de cada componente
- Relaciones entre piezas y herrajes en cada paso

Devuelve EXACTAMENTE este JSON (con los datos reales del manual):
{{
  "producto": "nombre del producto si se identifica",
  "piezas": [
    {{
      "id": "número o código de la pieza",
      "descripcion": "descripción según el manual",
      "cantidad": 1,
      "dimensiones": null,
      "confianza": "confirmado_manual_texto_y_visual",
      "paginas": [3]
    }}
  ],
  "herrajes": [
    {{
      "letra": "A",
      "tipo": "tornillo",
      "descripcion": "descripción según el manual",
      "dimensiones": null,
      "cantidad": 10,
      "confianza": "confirmado_manual_texto",
      "paginas": [2]
    }}
  ],
  "relaciones": [
    {{
      "paso": 1,
      "piezas": ["6", "7"],
      "herrajes": [{{"letra": "J", "cantidad": 4}}],
      "paginas": [5],
      "confianza": "confirmado_manual"
    }}
  ],
  "no_confirmados": ["lista de letras o piezas que aparecen pero no se pueden identificar con certeza"]
}}

Si no existe evidencia suficiente para un campo, usa array vacío [].
NUNCA rellenes con suposiciones."""
        })

        # añado todas las imágenes disponibles
        for p in paginas_imagenes:
            contenido.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": p["imagen_b64"]
                }
            })
            contenido.append({
                "type": "text",
                "text": f"[Imagen de la página {p['pagina']}]"
            })

        print(f"=== VISION: enviando {len(paginas_imagenes)} páginas a Claude Haiku ===")

        mensaje = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=2000,
            system=prompt_sistema,
            messages=[{"role": "user", "content": contenido}],
            timeout=60.0
        )

        raw = mensaje.content[0].text
        print(f"=== VISION: respuesta recibida ({len(raw)} chars) ===")

        inicio = raw.find("{")
        fin = raw.rfind("}") + 1
        if inicio == -1 or fin <= inicio:
            print("=== VISION: respuesta no contiene JSON válido ===")
            return None

        inventario = json.loads(raw[inicio:fin])

        # validación básica de estructura
        if not isinstance(inventario, dict):
            return None

        # normalizo campos obligatorios
        inventario.setdefault("piezas", [])
        inventario.setdefault("herrajes", [])
        inventario.setdefault("relaciones", [])
        inventario.setdefault("no_confirmados", [])

        total = len(inventario["piezas"]) + len(inventario["herrajes"])
        print(f"=== VISION: inventario extraído — {len(inventario['piezas'])} piezas, {len(inventario['herrajes'])} herrajes, {len(inventario['relaciones'])} relaciones ===")

        return inventario

    except anthropic.APITimeoutError:
        print("=== VISION: timeout de 60s — inventario no disponible ===")
        return None
    except Exception as e:
        print(f"=== VISION: error extrayendo inventario — {e} ===")
        traceback.print_exc()
        return None


def extraer_y_trocear_pdf(pdf_content, manual_id):
    """
    flujo completo de procesamiento del pdf:
    1. extrae texto página a página
    2. genera chunks y embeddings → commit inmediato
    3. rasteriza páginas para análisis visual
    4. extrae inventario estructurado con Claude Haiku (texto + visión)
    5. extrae metadata general con Groq
    6. persiste todo en ManualMetadata
    7. marca manual como listo
    """
    manual = Manual.query.get(manual_id)

    try:
        # extracción de texto página a página
        pdf_file = BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)

        texto_completo = ""
        for page_num, page in enumerate(reader.pages):
            texto = page.extract_text()
            if texto:
                texto_completo += f"\n--- Página {page_num + 1} ---\n" + texto

        print(f"=== PDF: {len(reader.pages)} páginas, {len(texto_completo)} caracteres ===")

        if not texto_completo.strip():
            raise Exception("el pdf no contiene texto extraíble — puede ser un pdf escaneado")

        # chunking para RAG
        palabras = texto_completo.split()
        tamanio_chunk = 200
        chunks = []

        for i in range(0, len(palabras), tamanio_chunk):
            chunk_texto = " ".join(palabras[i:i + tamanio_chunk])
            chunks.append(chunk_texto)

        for chunk_index, chunk_texto in enumerate(chunks):
            embedding = embeddings_model.encode(chunk_texto).tolist() if embeddings_model else []
            db.session.add(ManualChunk(
                manual_id=manual_id,
                content=chunk_texto,
                page_number=None,
                chunk_index=chunk_index,
                embedding=embedding
            ))

        # commit de chunks antes de llamar a modelos externos
        manual.total_chunks = len(chunks)
        db.session.commit()
        print(f"=== CHUNKS: {len(chunks)} guardados ===")

        # rasterización de páginas para análisis visual
        paginas_imagenes = rasterizar_paginas(pdf_content)

        # extracción de inventario estructurado con Claude Haiku (texto + visión)
        print(f"=== INVENTARIO: iniciando extracción para manual {manual_id} ===")
        inventario = extraer_inventario_con_vision(texto_completo, paginas_imagenes)

        # extracción de metadata general con Groq
        print(f"=== METADATA: iniciando extracción para manual {manual_id} ===")
        metadata_data = extraer_metadata_con_groq(texto_completo)

        # persisto todo en ManualMetadata
        existing = ManualMetadata.query.filter_by(manual_id=manual_id).first()
        if not existing:
            db.session.add(ManualMetadata(
                manual_id=manual_id,
                tools_required=metadata_data.get("tools_required") if metadata_data else None,
                parts_list=metadata_data.get("parts_list") if metadata_data else None,
                hardware_list=metadata_data.get("hardware_list") if metadata_data else None,
                total_steps=metadata_data.get("total_steps") if metadata_data else None,
                safety_warnings=metadata_data.get("safety_warnings") if metadata_data else None,
                estimated_time=metadata_data.get("estimated_time") if metadata_data else None,
                difficulty=metadata_data.get("difficulty") if metadata_data else None,
                components_inventory=inventario,
            ))
            print(f"=== METADATA: guardada {'con inventario' if inventario else 'sin inventario'} ===")
        else:
            # actualizo inventario si ya existía metadata
            existing.components_inventory = inventario
            if metadata_data:
                existing.tools_required = metadata_data.get("tools_required")
                existing.parts_list = metadata_data.get("parts_list")
                existing.hardware_list = metadata_data.get("hardware_list")
                existing.total_steps = metadata_data.get("total_steps")
                existing.safety_warnings = metadata_data.get("safety_warnings")
                existing.estimated_time = metadata_data.get("estimated_time")
                existing.difficulty = metadata_data.get("difficulty")
            print("=== METADATA: actualizada ===")

        manual.status = "listo"
        db.session.commit()
        print(f"=== MANUAL {manual_id}: listo con {len(chunks)} chunks ===")

    except Exception as err:
        traceback.print_exc()
        manual.status = "error"
        db.session.commit()
        print(f"=== MANUAL {manual_id}: error crítico: {err} ===")
        raise