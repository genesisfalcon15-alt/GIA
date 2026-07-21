<div align="center">

<img src="public/gia.svg" alt="GIA" width="80" />

# GIA

### Guía Inteligente de Instalación

**Tu copiloto de montaje.**

Sube el manual, haz una foto de la pieza y deja que GIA te acompañe paso a paso hasta el último tornillo.

</div>


## El problema

Todos hemos estado ahí: una caja abierta en el suelo, treinta piezas sin etiquetar y un manual lleno de dibujos que no hay quien interprete.

La idea de GIA nace de una mudanza real. Aunque tenía los manuales delante, seguía siendo imposible saber qué pieza iba dónde o si el montaje se estaba haciendo correctamente.

Existen aplicaciones para comprar muebles. Sin embargo, no hay ninguna que te acompañe mientras los montas.


## Qué hace GIA

GIA no es un chatbot genérico. Es un asistente que interpreta el manual de tu mueble y te guía durante todo el proceso.

- **Entiende tu manual.** Subes el PDF y lo convierte en instrucciones claras y fáciles de seguir.
- **Te dice qué necesitas.** Indica las herramientas necesarias, el tiempo estimado y cuántas personas hacen falta.
- **Ofrece alternativas seguras.** Si te falta una llave del 13, propone una alternativa cuando sea posible o te recomienda esperar si forzar la pieza puede dañarla.
- **Resuelve dudas en tiempo real.** Puedes preguntarle cualquier cosa mientras realizas el montaje.
- **Guarda tu progreso.** Permite retomar el montaje exactamente donde lo dejaste.

### Para quién

GIA está pensado tanto para particulares como para profesionales: montadores, carpinteros, electricistas, empresas de montaje y empresas de mudanzas.

Cada perfil dispone de una experiencia adaptada a sus necesidades.



## Stack tecnológico

El proyecto está dividido en tres bloques principales: frontend, backend y servicios externos.

### Frontend

| Tecnología | Uso |
|---|---|
| React + Vite | Interfaz de usuario y entorno de desarrollo |
| Tailwind CSS | Estilos y sistema de diseño |
| React Router DOM | Navegación entre páginas |
| Context API + useReducer | Gestión del estado global |

### Backend

| Tecnología | Uso |
|---|---|
| Python 3.12 + Flask | API REST |
| PostgreSQL | Base de datos |
| SQLAlchemy | ORM |
| Flask-Migrate (Alembic) | Versionado del esquema de la base de datos |
| Flask-JWT-Extended | Autenticación mediante tokens |
| Werkzeug | Hash de contraseñas |

### Servicios

| Servicio | Uso |
|---|---|
| Groq | Modelo de lenguaje para el asistente |
| Cloudinary | Almacenamiento de imágenes |
| Render | Despliegue |

## Estructura del proyecto

```
MontIA/
├── public/
│   └── gia.svg
├── src/
│   ├── api/
│   │   ├── models.py
│   │   ├── routes.py
│   │   ├── utils.py
│   │   ├── admin.py
│   │   └── commands.py
│   ├── front/
│   │   ├── pages/
│   │   │   ├── Home.jsx
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

La identidad de GIA sigue un estilo minimalista con inspiración escandinava. Se basa en una paleta de tonos naturales y una saturación muy baja para transmitir calma, limpieza y claridad durante todo el proceso de montaje.

Toda la paleta está definida en `tailwind.config.js` y se aplica mediante clases de Tailwind en toda la aplicación.

| Color | Hex | Uso |
|---|---|---|
| Deep Ocean | `#3C5160` | Color principal, textos y acciones |
| Ocean Vivo | `#2C4A63` | Degradados en botones |
| Sky | `#A9B5C2` | Acentos en modo oscuro |
| Ivoire | `#FAF8F6` | Fondo principal en modo claro |
| Gris Piedra | `#BAB3AE` | Textos secundarios |
| Douche | `#DDD6CE` | Bordes y superficies suaves |
| Noyer | `#A9895C` | Acentos inspirados en la madera |
| Mantequilla | `#F0DFA8` | Acento cálido puntual |
| Noche | `#232830` | Fondo en modo oscuro |

**Modo claro y oscuro:** GIA detecta la preferencia del sistema operativo la primera vez que se utiliza y permite cambiar entre ambos modos en cualquier momento. La elección del usuario queda guardada para las siguientes sesiones.

**Logo:** representa un tornillo y una tuerca en el momento exacto del ensamblaje. La animación, en la que el tornillo gira mientras la tuerca asciende hasta ajustarse, simboliza el acto de montar, fijar y asegurar cada pieza.


## Puesta en marcha

### Requisitos

Antes de empezar, asegúrate de tener instalado lo siguiente:

- Python 3.12
- Node.js
- PostgreSQL

### Instalación

```bash
# Clonar el proyecto e instalar las dependencias del backend
pipenv install

# Instalar las dependencias del frontend
npm install

# Crear la base de datos
createdb montia

# Configurar las variables de entorno
cp .env.example .env
```

Una vez creado el archivo `.env`, complétalo con tus propios valores:

```
DATABASE_URL=postgresql://usuario@localhost:5432/montia
FLASK_APP_KEY="clave-secreta-larga-y-aleatoria"
FLASK_APP=src/app.py
FLASK_DEBUG=1
VITE_BACKEND_URL=http://localhost:3001
GROQ_API_KEY=tu-clave-de-groq
```

### Migraciones

Después de configurar el proyecto, ejecuta las migraciones de la base de datos:

```bash
pipenv run migrate
pipenv run upgrade
```

### Arrancar el proyecto

Inicia el backend y el frontend en dos terminales diferentes.

```bash
# Terminal 1 — Backend (puerto 3001)
pipenv run start

# Terminal 2 — Frontend (puerto 3000)
npm run start
```

## API

La API expone los endpoints necesarios para el registro, la autenticación y la comprobación de que el servicio está funcionando correctamente.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/register` | Crea una cuenta. Valida los datos, comprueba si el usuario ya existe y almacena la contraseña de forma segura. |
| `POST` | `/api/login` | Verifica las credenciales y devuelve un token JWT. |
| `GET` | `/api/hello` | Endpoint de prueba para comprobar la conexión. |


## Seguridad

Desde el primer commit se han seguido una serie de medidas para proteger la aplicación y los datos de los usuarios.

- **Contraseñas hasheadas** con Werkzeug (scrypt). Nunca se almacenan ni se devuelven en texto plano.
- **Autenticación mediante JWT**, firmado con una clave secreta almacenada en el archivo `.env`.
- **Mensajes de error genéricos en el inicio de sesión.** No se distingue entre un correo inexistente y una contraseña incorrecta para evitar revelar información sobre las cuentas registradas.
- **El `user_id` se obtiene siempre del token**, nunca del cuerpo de la petición, evitando vulnerabilidades de tipo IDOR.
- **Las claves nunca se almacenan en el código.** Todas las variables sensibles se gestionan desde el archivo `.env`, incluido en `.gitignore`.
- **Validación tanto en frontend como en backend.** La validación del cliente mejora la experiencia de usuario, mientras que la del servidor garantiza la seguridad de la aplicación.


## Flujo de trabajo

```
main          ← producción
  └── develop ← integración de lo probado
        └── feature/* ← desarrollo del día a día
```

Cada bloque de funcionalidad se desarrolla en su propia rama `feature/*` y se integra en `develop` mediante Pull Request, una vez terminado y probado.



## Estado del proyecto

### Completado

- [x] Configuración del entorno (Python 3.12, PostgreSQL y Vite)
- [x] Modelo de usuario con roles (particular y profesional)
- [x] Registro con validaciones y hash de contraseña
- [x] Inicio de sesión con generación de token JWT
- [x] Sistema de diseño propio con Tailwind CSS
- [x] Modo claro y oscuro con detección de la preferencia del sistema
- [x] Logo animado, Navbar y Footer personalizados
- [x] Landing page

### En desarrollo

- [ ] Subida de manuales en PDF
- [ ] Extracción de texto del manual
- [ ] Chat con IA sobre el manual (RAG)
- [ ] Historial de conversaciones

### Próximas fases

- [ ] Área de cliente ("Mis montajes")
- [ ] Cronómetro de montaje y comparación con el tiempo estimado
- [ ] Guía de desmontaje para facilitar mudanzas o la venta del mueble
- [ ] Reconocimiento de piezas mediante fotografía
- [ ] Control por voz para trabajar con las manos libres
- [ ] Herramientas de gestión para profesionales

## Licencia

Este proyecto ha sido desarrollado con fines formativos y de portfolio.


<div align="center">

**GIA** · Guía Inteligente de Instalación

</div>