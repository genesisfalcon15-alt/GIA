# GIA — HANDOFF DOCUMENT
> Guía Inteligente de Instalación · Asistente pro max de montaje, instalación, reparación y restauración.
> Última actualización: agosto 2026

---

## OBJETIVO DEL PROYECTO

GIA es un asistente profesional especializado en montaje, instalación, reparación y restauración del hogar.

No es un chatbot genérico. Es una herramienta profesional que:
- Analiza manuales PDF y guía al usuario paso a paso
- Diagnostica problemas mediante imágenes
- Guía instalaciones sin manual
- Repara electrodomésticos con diagnóstico inteligente
- Restaura muebles de segunda mano

El objeto principal es el **proyecto**, no la conversación. La conversación es solo la interfaz.

---

## ARQUITECTURA COMPLETA

```
Frontend (React + Vite + Tailwind)
    ↓
Backend (Flask + Python)
    ↓
PostgreSQL (base de datos)
    ↓
Groq API (llama-3.3-70b-versatile) — IA
    ↓
Cloudinary — almacenamiento de PDFs
    ↓
SentenceTransformer (all-MiniLM-L6-v2) — embeddings RAG
```

### Pipeline RAG
```
PDF subido por usuario
    → PyPDF2 extrae texto
    → texto dividido en chunks de 200 palabras
    → SentenceTransformer genera embeddings
    → chunks + embeddings guardados en PostgreSQL
    → cuando el usuario pregunta:
        → cosine_similarity entre pregunta y chunks
        → top 5 chunks más relevantes
        → enviados a Groq como contexto
        → GIA responde usando el contenido real del manual
```

---

## TECNOLOGÍAS

| Tecnología | Por qué |
|---|---|
| Flask | Ligero, rápido, compatible con SQLAlchemy |
| PostgreSQL | Relacional, soporta JSON para embeddings |
| SQLAlchemy 2.0 | ORM moderno con Mapped/mapped_column |
| React + Vite | Frontend rápido, HMR |
| Tailwind CSS | Diseño escandinavo con clases personalizadas |
| Groq | Inferencia rápida de LLaMA |
| Cloudinary | Almacenamiento de PDFs e imágenes |
| SentenceTransformer | Embeddings locales sin coste por API |
| JWT (flask-jwt-extended) | Autenticación, tokens de 7 días |
| react-markdown | Renderizar markdown en mensajes del chat |
| lucide-react | Iconografía de línea fina escandinava |

---

## ESTRUCTURA DE CARPETAS

```
MontIA/
├── src/
│   ├── app.py                          # arranque Flask, blueprints, JWT
│   ├── api/
│   │   ├── models.py                   # todos los modelos SQLAlchemy
│   │   ├── groq_service.py             # system prompt GIA + llamada a Groq
│   │   ├── knowledge_service.py        # RAG: embeddings + búsqueda semántica
│   │   ├── conversation_context_service.py  # cerebro: decide qué contexto enviar a Groq
│   │   ├── pdf_processor.py            # extrae texto, genera chunks y embeddings
│   │   ├── storage_service.py          # Cloudinary
│   │   ├── utils.py                    # APIException, generate_sitemap
│   │   ├── admin.py                    # panel admin Flask-Admin
│   │   ├── commands.py                 # comandos CLI
│   │   └── routes/
│   │       ├── __init__.py             # registra todos los blueprints
│   │       ├── auth.py                 # /register (con token), /login
│   │       ├── chat.py                 # /chat (endpoint principal de mensajes)
│   │       ├── conversations.py        # /conversations (historial)
│   │       ├── manuals.py              # /manuals/:id/upload
│   │       └── projects.py             # /projects (CRUD proyectos, timeline, notas)
│   └── front/
│       ├── main.jsx                    # punto de entrada React
│       ├── routes.jsx                  # todas las rutas de la app
│       ├── components/
│       │   ├── Navbar.jsx              # navbar con tema oscuro persistente en localStorage
│       │   ├── LogoGia.jsx             # logo SVG de GIA
│       │   └── ScrollToTop.jsx         # scroll al top en navegación
│       └── pages/
│           ├── Layout.jsx              # Layout principal (sin footer)
│           ├── Home.jsx                # centro de trabajo, 5 tarjetas + nuevo proyecto
│           ├── Chat.jsx                # chat principal con sidebar, voz, cámara, PDF, barra progreso
│           ├── Login.jsx               # login
│           ├── Register.jsx            # registro → /onboarding (con token en respuesta)
│           ├── Onboarding.jsx          # flujo bienvenida 5 pasos, fuera del Layout
│           ├── NuevoProyecto.jsx       # flujo guiado: nombre → PDF → resumen → chat
│           ├── Montajes.jsx            # biblioteca de proyectos → /proyecto/:id
│           ├── Proyecto.jsx            # ficha proyecto con pestañas
│           ├── Instalar.jsx            # selector producto + pared → chat
│           ├── Reparar.jsx             # selector aparato + síntoma → chat
│           ├── Perfil.jsx              # perfil usuario con datos onboarding
│           └── About.jsx               # página about
```

---

## MODELOS DE BASE DE DATOS

### User
- id, email, password (hash), is_active, role, is_pro
- daily_message_count, last_message_date

### Project
- id, user_id, title, status, category, progress, time_invested
- created_at, updated_at
- Relaciones: manuals, chat_history, timeline, notes, photos

### Manual
- id, project_id, file_url (Cloudinary), original_filename, status, total_chunks
- status: procesando | listo | error

### ManualChunk
- id, manual_id, content, embedding (JSON), page_number, chunk_index

### ManualMetadata
- id, manual_id, tools_required, parts_list, hardware_list
- total_steps, safety_warnings, estimated_time, difficulty

### ChatHistory
- id, project_id, user_message, gia_response, chunks_used, tokens_used

### ProjectTimeline
- id, project_id, evento, tipo (info|incidencia|hito|completado)

### ProjectNote
- id, project_id, content

### ProjectPhoto
- id, project_id, url, caption

---

## ENDPOINTS

### Auth
- `POST /api/auth/register` → crea usuario + devuelve token JWT ← CORREGIDO (antes no devolvía token)
- `POST /api/auth/login` → autentica + devuelve token JWT

### Chat
- `POST /api/chat` → mensaje principal. Recibe {conversation_id, message}. Llama a Groq con contexto RAG. Devuelve {message, conversation_id}

### Conversations
- `GET /api/conversations` → lista proyectos con título, last_message, has_manual, message_count
- `GET /api/conversations/:id` → detalle con todos los mensajes
- `DELETE /api/conversations/:id` → elimina proyecto

### Manuals
- `POST /api/manuals/:project_id/upload` → sube PDF, procesa chunks, embeddings y metadata

### Projects
- `GET /api/projects/` → lista proyectos
- `GET /api/projects/:id` → detalle con timeline, notas y fotos
- `PATCH /api/projects/:id` → actualiza status, category, progress
- `DELETE /api/projects/:id` → elimina
- `POST /api/projects/:id/timeline` → añade evento
- `GET /api/projects/:id/notes` → notas
- `POST /api/projects/:id/notes` → añade nota
- `DELETE /api/projects/:id/notes/:note_id` → elimina nota

---

## ARCHIVOS NUEVOS CREADOS EN FRONTEND

| Archivo | Qué hace |
|---|---|
| NuevoProyecto.jsx | Flujo guiado: nombre → PDF opcional → resumen GIA → chat |
| Onboarding.jsx | Bienvenida al registrarse. 5 pasos. Particular o Empresa. Stepper horizontal |
| Montajes.jsx | Biblioteca de todos los proyectos del usuario. Lleva a /proyecto/:id |
| Proyecto.jsx | Ficha de proyecto con pestañas: Resumen, Chat, Manuales, Fotos, Notas |
| Instalar.jsx | Selector de producto (TV, lámpara...) + tipo de pared → chat con contexto |
| Reparar.jsx | Selector de aparato + síntoma → chat con diagnóstico inteligente |
| Perfil.jsx | Perfil usuario: email, plan, datos del onboarding editables |

---

## LO QUE NECESITA EL BACKEND PARA QUE EL FRONTEND FUNCIONE AL 100%

1. **Visión de imágenes** — botón cámara existe pero GIA no ve la foto real
   - Subir imagen a Cloudinary
   - Enviarla a Claude claude-haiku-4-5 o Groq Vision
   - Devolver análisis real

2. **Guardar perfil del onboarding en BD** — ahora va a localStorage
   - Endpoint `POST /api/users/profile`
   - Tabla `UserProfile` con los campos del onboarding

3. **Persistir barra de progreso** — solo en React, se pierde al recargar
   - Campo `current_step` en `Project`
   - Backend actualiza al detectar avance

4. **Notas del proyecto** — pestaña existe, no guarda en BD
   - El endpoint ya existe: `POST /api/projects/:id/notes`
   - El frontend no lo usa todavía

5. **Fotos del proyecto** — pestaña existe pero vacía
   - Endpoint de subida de imágenes
   - Tabla `ProjectPhoto` ya existe en BD

6. **Títulos automáticos fiables** — Groq no siempre respeta el JSON
   - Lógica de fallback más robusta en groq_service.py

7. **Memoria entre proyectos** — conversation_context_service no recupera otras conversaciones
   - Buscar proyectos anteriores del usuario en BD
   - Inyectar resumen en el contexto de Groq

8. **Timeline automático** — tabla existe en BD, nada la escribe
   - chat.py debe escribir eventos automáticamente (manual subido, paso completado, etc.)

---

## VARIABLES DE ENTORNO (.env)

```
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FLASK_APP_KEY=...
FLASK_DEBUG=1
```

---

## DECISIONES TÉCNICAS TOMADAS

| Decisión | Motivo |
|---|---|
| Groq en lugar de OpenAI | Más rápido y barato para prototipos |
| SentenceTransformer local | Sin coste por API |
| JWT 7 días | Tokens de 15 min causaban fallos al subir PDFs |
| Commit chunks ANTES de metadata | Si Groq falla en metadata, chunks quedan guardados |
| Eliminar manual anterior al subir nuevo | Evita duplicados que confunden al RAG |
| Carga lazy de SentenceTransformer | Flask arranca aunque torch/numpy tengan conflictos |
| Sin footer | GIA es herramienta profesional, no web corporativa |
| sessionStorage para contexto inicial | Cada tarjeta pasa contexto al chat sin modificar URLs |
| Onboarding fuera del Layout | Evita que el Navbar bloquee los clics |
| register devuelve token | El frontend lo guarda y va directo al onboarding sin re-login |
| .replace("**", "") en servidor | Elimina asteriscos aunque Groq los cuele |

---

## ALTERNATIVAS DESCARTADAS

| Alternativa | Por qué se descartó |
|---|---|
| OpenAI GPT-4 | Más caro, Groq suficiente por ahora |
| Pinecone | Coste innecesario, PostgreSQL + cosine_similarity suficiente |
| Footer en todas las páginas | GIA es herramienta, no página web |
| Historial en Home | Solo en sidebar del chat |
| Conversación única por usuario | Cada proyecto tiene memoria independiente |

---

## PROBLEMAS CONOCIDOS

### Críticos
1. GIA no ve imágenes reales — botón existe, solo recibe texto
2. Asteriscos en Groq — parcialmente resuelto en servidor, Groq los sigue colando a veces

### Importantes
3. Perfil del onboarding en localStorage, no en BD
4. Barra de progreso no persiste al recargar
5. Notas no se guardan en BD
6. Memoria entre proyectos no implementada en backend
7. Timeline no se escribe automáticamente

### Menores
8. NumPy 2.x incompatible con torch 2.2.2 — workaround: `pip install "numpy<2"`
9. Títulos de conversación a veces genéricos

---

## ESTADO ACTUAL

### ✅ Completado
- Autenticación completa (register con token, login, JWT 7 días)
- Onboarding 5 pasos (Particular/Empresa), stepper, fuera del Layout
- Home con 5 tarjetas funcionales + nuevo proyecto
- /instalar y /reparar con selectores visuales
- /nuevo-proyecto flujo guiado completo
- Chat con PDF, cámara, micrófono, barra progreso, ReactMarkdown
- /montajes biblioteca de proyectos
- /proyecto/:id con pestañas
- /perfil con datos onboarding
- Tema oscuro persistente en localStorage
- System prompt GIA v3 sin asteriscos
- RAG pipeline funcionando
- Contexto automático por tarjeta (sessionStorage)

### ⚠️ Parcialmente implementado
- Títulos automáticos (Groq no siempre respeta JSON)
- Análisis de imágenes (botón funciona, GIA no ve la foto)
- Notas (pestaña existe, sin BD)
- Barra de progreso (frontend solo, sin persistencia)

### ❌ Pendiente
- Visión de imágenes real
- Perfil onboarding en BD
- Memoria entre proyectos
- Timeline automático
- Migración a Claude API

---

## PRÓXIMA TAREA

**Estabilización en orden:**
1. Verificar tema oscuro no cambia al navegar
2. Verificar títulos automáticos se generan bien
3. Verificar cada tarjeta crea conversación nueva
4. Verificar onboarding fluye sin errores hasta Home

**Después:**
- Visión de imágenes (Claude claude-haiku-4-5)
- Perfil onboarding en BD
- Persistir barra de progreso

---

## INSTRUCCIONES PARA NUEVA CONVERSACIÓN

Al inicio di: **"go GIA"**

**Reglas que NO se cuestionan:**
- Sin footer en ninguna página
- Diseño escandinavo (Norm Architects, Frama, Muuto, Linear, Apple)
- Paleta: bg-ivoire, text-noyer/mantequilla, text-gris-piedra, border-douche
- El proyecto es el objeto principal, no la conversación
- Cada tarjeta del Home inicia conversación nueva
- JWT 7 días
- Groq llama-3.3-70b-versatile hasta migrar a Claude
- Sin asteriscos en respuestas de GIA

**Archivos más importantes:**
- `src/api/groq_service.py` — system prompt completo
- `src/api/conversation_context_service.py` — cerebro del RAG
- `src/front/pages/Chat.jsx` — interfaz principal
- `src/front/pages/Home.jsx` — centro de trabajo
- `src/front/routes.jsx` — todas las rutas
