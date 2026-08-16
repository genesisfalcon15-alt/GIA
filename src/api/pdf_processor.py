import PyPDF2
import traceback
import json
import requests
import os
import base64
import anthropic
from io import BytesIO
from api.models import db, Manual, ManualChunk, ManualMetadata

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
            return None

        prompt = f"""Analyze this assembly manual fragment and extract structured information.
If a field is not present in the text, use null.
Respond ONLY with valid JSON, no text before or after.

Manual text:
{texto_muestra}

Expected JSON:
{{
  "tools_required": ["tools mentioned"],
  "parts_list": ["parts or components mentioned"],
  "hardware_list": ["screws, nuts, anchors mentioned"],
  "total_steps": null,
  "safety_warnings": ["safety warnings mentioned"],
  "estimated_time": null,
  "difficulty": "easy"
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
    convierte páginas del pdf a imágenes base64 usando PyMuPDF.
    """
    try:
        import fitz
        paginas = []
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        for num, pagina in enumerate(doc):
            mat = fitz.Matrix(150 / 72, 150 / 72)
            pix = pagina.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
            img_bytes = pix.tobytes("png")
            img_b64 = base64.standard_b64encode(img_bytes).decode("utf-8")
            paginas.append({"pagina": num + 1, "imagen_b64": img_b64})
        doc.close()
        print(f"=== VISION: {len(paginas)} páginas rasterizadas ===")
        return paginas
    except ImportError:
        print("=== VISION: PyMuPDF no disponible ===")
        return []
    except Exception as e:
        print(f"=== VISION: error rasterizando — {e} ===")
        return []


def _parsear_json_bloque(raw):
    """
    parsea json de un bloque — solo acepta json completo y válido.
    """
    inicio = raw.find("{")
    fin = raw.rfind("}") + 1
    if inicio == -1 or fin <= inicio:
        return None
    try:
        resultado = json.loads(raw[inicio:fin])
        if not isinstance(resultado, dict):
            return None
        return resultado
    except json.JSONDecodeError as e:
        print(f"=== VISION BLOQUE: JSON inválido — {e} ===")
        return None


def _validar_bloque(bloque):
    """
    valida que el bloque tenga estructura mínima.
    """
    if not isinstance(bloque, dict):
        return False
    if "herrajes" not in bloque and "piezas" not in bloque:
        return False
    return True


def _combinar_inventarios(bloques):
    """
    combina resultados de múltiples bloques en un único inventario.
    consolida herrajes y piezas duplicados.
    """
    inventario_final = {
        "producto": None,
        "piezas": [],
        "herrajes": [],
        "relaciones": [],
        "no_confirmados": []
    }

    piezas_vistas = {}
    herrajes_vistos = {}
    no_confirmados_set = set()

    for bloque in bloques:
        if not bloque:
            continue

        if not inventario_final["producto"] and bloque.get("producto"):
            inventario_final["producto"] = bloque["producto"]

        for pieza in bloque.get("piezas", []):
            pid = str(pieza.get("id", "")).strip()
            if not pid:
                continue
            if pid not in piezas_vistas:
                piezas_vistas[pid] = pieza
            else:
                existente = piezas_vistas[pid]
                paginas_nuevas = pieza.get("paginas", [])
                existente["paginas"] = list(set(existente.get("paginas", []) + paginas_nuevas))
                if "texto_y_visual" in pieza.get("confianza", "") and "texto_y_visual" not in existente.get("confianza", ""):
                    existente["confianza"] = pieza["confianza"]

        for herraje in bloque.get("herrajes", []):
            letra = str(herraje.get("letra", "")).strip().upper()
            if not letra:
                continue
            if letra not in herrajes_vistos:
                herrajes_vistos[letra] = herraje
            else:
                existente = herrajes_vistos[letra]
                paginas_nuevas = herraje.get("paginas", [])
                existente["paginas"] = list(set(existente.get("paginas", []) + paginas_nuevas))
                if "texto_y_visual" in herraje.get("confianza", "") and "texto_y_visual" not in existente.get("confianza", ""):
                    existente["confianza"] = herraje["confianza"]
                if herraje.get("cantidad") and not existente.get("cantidad"):
                    existente["cantidad"] = herraje["cantidad"]

        pasos_existentes = {r.get("paso") for r in inventario_final["relaciones"]}
        for rel in bloque.get("relaciones", []):
            if rel.get("paso") not in pasos_existentes:
                inventario_final["relaciones"].append(rel)
                pasos_existentes.add(rel.get("paso"))

        for nc in bloque.get("no_confirmados", []):
            no_confirmados_set.add(str(nc))

    inventario_final["piezas"] = list(piezas_vistas.values())
    inventario_final["herrajes"] = list(herrajes_vistos.values())
    inventario_final["no_confirmados"] = list(no_confirmados_set)

    return inventario_final


def _extraer_bloque_con_haiku(client, texto_bloque, paginas_bloque, num_bloque):
    """
    extrae inventario de un bloque de 4 páginas con claude haiku.
    prompt compacto — solo datos estructurados.
    funciona con manuales en cualquier idioma.
    """
    prompt_sistema = """You are an assembly manual analysis system.
Extract ONLY components that appear clearly in the manual pages.
NEVER invent parts, letters, quantities or relations.
Respond ONLY with valid compact JSON. No text before or after. No code blocks.
The manual may be in any language. Extract data regardless of language."""

    contenido = []

    contenido.append({
        "type": "text",
        "text": f"""Analyze these assembly manual pages (block {num_bloque}).
Extract ONLY what clearly appears. Use confidence levels:
- "confirmado_manual_texto" = clear in text
- "confirmado_manual_visual" = clear in image/diagram
- "confirmado_manual_texto_y_visual" = both
- "no_confirmado" = inferred only

Text from these pages:
{texto_bloque[:2000]}

Return ONLY this compact JSON structure:
{{"piezas":[{{"id":"6","descripcion":"left panel","cantidad":1,"confianza":"confirmado_manual_visual","paginas":[3]}}],"herrajes":[{{"letra":"A","tipo":"screw","descripcion":"fixing screw","dimensiones":null,"cantidad":10,"confianza":"confirmado_manual_texto","paginas":[2]}}],"relaciones":[{{"paso":1,"piezas":["6","7"],"herrajes":[{{"letra":"A","cantidad":4}}],"paginas":[5],"confianza":"confirmado_manual"}}],"no_confirmados":[]}}

Use [] for empty arrays. Only include what you can confirm from these pages."""
    })

    for p in paginas_bloque:
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
            "text": f"[Page {p['pagina']}]"
        })

    try:
        mensaje = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=4096,
            system=prompt_sistema,
            messages=[{"role": "user", "content": contenido}],
            timeout=45.0
        )

        raw = mensaje.content[0].text
        print(f"=== VISION BLOQUE {num_bloque}: {len(raw)} chars ===")

        resultado = _parsear_json_bloque(raw)
        if not resultado:
            print(f"=== VISION BLOQUE {num_bloque}: JSON inválido — descartando ===")
            return None

        if not _validar_bloque(resultado):
            print(f"=== VISION BLOQUE {num_bloque}: estructura inválida — descartando ===")
            return None

        resultado.setdefault("piezas", [])
        resultado.setdefault("herrajes", [])
        resultado.setdefault("relaciones", [])
        resultado.setdefault("no_confirmados", [])

        print(f"=== VISION BLOQUE {num_bloque}: {len(resultado['piezas'])} piezas, {len(resultado['herrajes'])} herrajes ===")
        return resultado

    except anthropic.APITimeoutError:
        print(f"=== VISION BLOQUE {num_bloque}: timeout — descartando ===")
        return None
    except Exception as e:
        print(f"=== VISION BLOQUE {num_bloque}: error — {e} ===")
        return None


def extraer_inventario_con_vision(texto_completo, paginas_imagenes):
    """
    extrae inventario procesando páginas en bloques de 4.
    combina resultados en python.
    funciona con manuales en cualquier idioma.
    """
    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        # divido texto por páginas
        texto_por_pagina = {}
        lineas = texto_completo.split("\n")
        pagina_actual = 1
        buffer = []
        for linea in lineas:
            if linea.startswith("--- Página "):
                try:
                    num = int(linea.replace("--- Página ", "").replace(" ---", "").strip())
                    if buffer:
                        texto_por_pagina[pagina_actual] = "\n".join(buffer)
                    pagina_actual = num
                    buffer = []
                except ValueError:
                    buffer.append(linea)
            else:
                buffer.append(linea)
        if buffer:
            texto_por_pagina[pagina_actual] = "\n".join(buffer)

        # bloques de 4 páginas
        tamanio_bloque = 4
        bloques_resultados = []
        total_paginas = len(paginas_imagenes) if paginas_imagenes else 0

        if total_paginas == 0:
            print("=== VISION: procesando solo texto ===")
            resultado = _extraer_bloque_con_haiku(client, texto_completo[:4000], [], 1)
            if resultado:
                bloques_resultados.append(resultado)
        else:
            num_bloques = (total_paginas + tamanio_bloque - 1) // tamanio_bloque
            print(f"=== VISION: {total_paginas} páginas → {num_bloques} bloques de {tamanio_bloque} ===")

            for i in range(0, total_paginas, tamanio_bloque):
                bloque_paginas = paginas_imagenes[i:i + tamanio_bloque]
                nums_paginas = [p["pagina"] for p in bloque_paginas]

                texto_bloque = "\n".join([
                    texto_por_pagina.get(num, "")
                    for num in nums_paginas
                ])

                num_bloque = (i // tamanio_bloque) + 1
                print(f"=== VISION: bloque {num_bloque}/{num_bloques} — páginas {nums_paginas} ===")

                resultado = _extraer_bloque_con_haiku(client, texto_bloque, bloque_paginas, num_bloque)
                if resultado:
                    bloques_resultados.append(resultado)

        if not bloques_resultados:
            print("=== VISION: todos los bloques fallaron ===")
            return None

        inventario_final = _combinar_inventarios(bloques_resultados)

        total = len(inventario_final["piezas"]) + len(inventario_final["herrajes"])
        print(f"=== VISION: inventario final — {len(inventario_final['piezas'])} piezas, {len(inventario_final['herrajes'])} herrajes, {len(inventario_final['relaciones'])} relaciones ===")

        if total == 0:
            print("=== VISION: inventario vacío ===")
            return None

        return inventario_final

    except Exception as e:
        print(f"=== VISION: error general — {e} ===")
        traceback.print_exc()
        return None


def extraer_y_trocear_pdf(pdf_content, manual_id):
    """
    flujo completo:
    1. extrae texto
    2. genera chunks y embeddings
    3. rasteriza páginas
    4. extrae inventario en bloques de 4 páginas
    5. extrae metadata con groq
    6. persiste todo
    7. marca manual como listo
    """
    manual = Manual.query.get(manual_id)

    try:
        pdf_file = BytesIO(pdf_content)
        reader = PyPDF2.PdfReader(pdf_file)

        texto_completo = ""
        for page_num, page in enumerate(reader.pages):
            texto = page.extract_text()
            if texto:
                texto_completo += f"\n--- Página {page_num + 1} ---\n" + texto

        print(f"=== PDF: {len(reader.pages)} páginas, {len(texto_completo)} caracteres ===")

        if not texto_completo.strip():
            raise Exception("el pdf no contiene texto extraíble")

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

        manual.total_chunks = len(chunks)
        db.session.commit()
        print(f"=== CHUNKS: {len(chunks)} guardados ===")

        paginas_imagenes = rasterizar_paginas(pdf_content)

        print(f"=== INVENTARIO: iniciando para manual {manual_id} ===")
        inventario = extraer_inventario_con_vision(texto_completo, paginas_imagenes)

        print(f"=== METADATA: iniciando para manual {manual_id} ===")
        metadata_data = extraer_metadata_con_groq(texto_completo)

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