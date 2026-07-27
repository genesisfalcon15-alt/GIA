
<p align="center">
  <img src="./public/gia.svg" alt="GIA Logo" width="80" />
</p>

# GIA — Guía Inteligente de Instalación

Tu copiloto de montaje.


## El problema

Todos hemos pasado por eso: una caja abierta en el suelo, treinta piezas sin etiquetar y un manual lleno de dibujos que no hay quien interprete.

GIA nace de una mudanza real. Aunque tenía los manuales delante, seguía siendo imposible saber qué pieza iba dónde o si el montaje se estaba haciendo correctamente.

Existen aplicaciones para comprar muebles. Pero no hay ninguna que te acompañe mientras los montas.

## Qué es GIA

GIA no es un chatbot genérico.

Es un asistente especializado en montaje e instalación que interpreta el manual de tu producto y te guía durante todo el proceso, paso a paso, en lenguaje claro.

Puedes subir el PDF del manual, hacerle preguntas concretas mientras montas, y retomar la conversación exactamente donde la dejaste.


## Cómo funciona

El flujo principal es sencillo:

1. El usuario sube el manual en PDF.
2. GIA extrae el texto, lo divide en fragmentos y genera embeddings semánticos.
3. Cuando el usuario hace una pregunta, GIA busca los fragmentos más relevantes del manual.
4. Esos fragmentos, junto con la pregunta, se envían a Groq.
5. Groq genera una respuesta basada únicamente en el manual del usuario.
6. La conversación queda guardada para poder continuar más adelante.

Este enfoque se conoce como RAG (Retrieval-Augmented Generation). Permite que GIA responda con información real del manual en lugar de improvisar respuestas genéricas.


## Para quién

GIA está pensado para particulares y profesionales:

- Personas que montan muebles en casa.
- Montadores e instaladores.
- Empresas de mudanzas.
- Electricistas, carpinteros y otros profesionales del sector.

Cada perfil tiene una experiencia adaptada a sus necesidades.



## Stack

**Frontend**
- React + Vite
- Tailwind CSS
- React Router DOM
- Context API + useReducer

**Backend**
- Python 3.12 + Flask
- PostgreSQL
- SQLAlchemy + Flask-Migrate
- Flask-JWT-Extended

**Servicios externos**
- Groq — modelo de lenguaje
- Cloudinary — almacenamiento de archivos
- Render — despliegue



## Estructura del proyecto

```
GIA/
├── public/
│   └── gia.svg
├── src/
│   ├── api/
│   │   ├── models.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── conversations.py
│   │   │   └── manuals.py
│   │   ├── groq_service.py
│   │   ├── knowledge_service.py
│   │   ├── storage_service.py
│   │   ├── pdf_processor.py
│   │   ├── utils.py
│   │   ├── admin.py
│   │   └── commands.py
│   ├── front/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Layout.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LogoGia.jsx
│   │   │   └── ToggleTema.jsx
│   │   ├── hooks/
│   │   │   └── useGlobalReducer.jsx
│   │   ├── routes.jsx
│   │   ├── store.js
│   │   └── index.css
│   ├── app.py
│   └── wsgi.py
├── migrations/
├── tailwind.config.js
├── .env.example
└── Pipfile
```

## Sistema de diseño

GIA sigue un estilo minimalista con inspiración escandinava. La paleta usa tonos naturales y saturación baja para transmitir calma y claridad.

| Color | Hex | Uso |
|-------|-----|-----|
| Deep Ocean | `#3C5160` | Color principal, textos y acciones |
| Ocean Vivo | `#2C4A63` | Degradados en botones |
| Sky | `#A9B5C2` | Acentos en modo oscuro |
| Ivoire | `#FAF8F6` | Fondo principal en modo claro |
| Gris Piedra | `#BAB3AE` | Textos secundarios |
| Douche | `#DDD6CE` | Bordes y superficies suaves |
| Noyer | `#A9895C` | Acentos inspirados en la madera |
| Noche | `#232830` | Fondo en modo oscuro |

El modo oscuro se detecta automáticamente según la preferencia del sistema y puede cambiarse en cualquier momento.

El logo representa un tornillo y una tuerca en el momento del ensamblaje. La animación simboliza el acto de montar y asegurar cada pieza.

## Puesta en marcha

**Requisitos**
- Python 3.12
- Node.js
- PostgreSQL

**Instalación**

```bash
# Instalar dependencias del backend
pipenv install

# Instalar dependencias del frontend
npm install

# Crear la base de datos
createdb gia

# Configurar variables de entorno
cp .env.example .env
```

Completa el archivo `.env` con tus valores:

```
DATABASE_URL=postgresql://usuario@localhost:5432/gia
FLASK_APP_KEY="clave-secreta-larga-y-aleatoria"
FLASK_APP=src/app.py
FLASK_DEBUG=1
VITE_BACKEND_URL=http://localhost:3001
GROQ_API_KEY=tu-clave-de-groq
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

**Migraciones**

```bash
pipenv run migrate
pipenv run upgrade
```

**Arrancar el proyecto**

```bash
# Terminal 1 — Backend (puerto 3001)
pipenv run start

# Terminal 2 — Frontend (puerto 3000)
npm run start
```


## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión, devuelve JWT |
| GET | `/api/conversations` | Listar conversaciones del usuario |
| GET | `/api/conversations/<id>` | Obtener conversación completa con mensajes |
| DELETE | `/api/conversations/<id>` | Borrar conversación |
| POST | `/api/chat` | Enviar mensaje a GIA (crea conversación si no existe) |
| POST | `/api/manuals/<id>/upload` | Subir PDF a una conversación |


## Seguridad

Algunas decisiones que se han tomado desde el principio:

- Las contraseñas se almacenan con hash usando Werkzeug (scrypt). Nunca en texto plano.
- La autenticación usa JWT firmado con clave secreta en `.env`.
- Los mensajes de error en el login son genéricos para no revelar si el correo existe.
- El `user_id` siempre se obtiene del token, nunca del body de la petición.
- Ninguna clave sensible está en el código.

## Estado actual

**Completado**
- [x] Autenticación completa (registro, login, JWT)
- [x] Sistema de diseño con Tailwind CSS
- [x] Modo claro y oscuro
- [x] Logo animado, Navbar y Footer
- [x] Landing page
- [x] Chat conversacional con GIA
- [x] Historial de conversaciones en sidebar
- [x] Borrar conversaciones
- [x] Subida de PDFs a Cloudinary
- [x] Extracción de texto y generación de chunks
- [x] Embeddings con sentence-transformers
- [x] RAG con búsqueda semántica
- [x] Integración con Groq (llama-3.3-70b-versatile)
- [x] System prompt oficial de GIA

**En desarrollo**
- [ ] Subida de PDF directamente desde el chat
- [ ] Soporte para imágenes
- [ ] Perfil de usuario
- [ ] Mis guías (manuales subidos)

**Próximas fases**
- [ ] OCR para manuales fotografiados
- [ ] Visión artificial para identificar piezas
- [ ] Control por voz
- [ ] Herramientas para profesionales
- [ ] Guía de desmontaje

## Flujo de trabajo

```
main          ← producción
  └── develop ← integración
        └── feature/* ← desarrollo
```

Cada funcionalidad se desarrolla en su propia rama `feature/*` y se integra en `develop` mediante Pull Request una vez terminada y probada.


## Licencia

Proyecto desarrollado con fines formativos y de portfolio.

**GIA · Guía Inteligente de Instalación**