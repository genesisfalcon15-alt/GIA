# Graph Report - MontIA  (2026-08-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 597 nodes · 1419 edges · 49 communities (43 shown, 6 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 211 edges (avg confidence: 0.51)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `62acd716`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- o
- routes.jsx
- Project
- bundle.js
- models.py
- app.py
- nu
- devDependencies
- chat.py
- ao
- ot
- conversation_context_service.py
- Zo
- main.jsx
- dependencies
- package.json
- yu
- auth.py
- fl
- migrations/env.py
- ii
- sl
- src/migrations/env.py
- send_message
- babel
- scripts
- El
- pt
- storage_service.py
- database.sh
- reset_migrations.bash
- @types/react
- render_build.sh
- ProjectItem
- ProjectTool
- UserTool

## God Nodes (most connected - your core abstractions)
1. `o()` - 60 edges
2. `n()` - 33 edges
3. `l()` - 29 edges
4. `Zo()` - 29 edges
5. `Project` - 28 edges
6. `APIException` - 28 edges
7. `r()` - 28 edges
8. `sa()` - 27 edges
9. `e()` - 21 edges
10. `t()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `construir_contexto_conversacion()` --uses--> `UserProfile`  [INFERRED]
  src/api/conversation_context_service.py → src/api/models.py
- `buscar_proyectos_anteriores()` --uses--> `Project`  [INFERRED]
  src/api/conversation_context_service.py → src/api/models.py
- `construir_contexto_conversacion()` --uses--> `Project`  [INFERRED]
  src/api/conversation_context_service.py → src/api/models.py
- `send_image()` --uses--> `Project`  [INFERRED]
  src/api/routes/chat.py → src/api/models.py
- `send_message()` --uses--> `Project`  [INFERRED]
  src/api/routes/chat.py → src/api/models.py

## Import Cycles
- None detected.

## Communities (49 total, 6 thin omitted)

### Community 0 - "o"
Cohesion: 0.10
Nodes (67): C(), co(), D(), e(), eo(), et(), F(), g() (+59 more)

### Community 1 - "routes.jsx"
Cohesion: 0.05
Nodes (37): LogoGia(), Navbar(), ScrollToTop(), ToggleTema(), About(), Chat(), ACCIONES, fechaHoy() (+29 more)

### Community 2 - "Project"
Cohesion: 0.10
Nodes (41): Project, ProjectNote, ProjectPhoto, ProjectTimeline, delete_conversation(), get_conversation(), get_conversations(), jwt_required (+33 more)

### Community 3 - "bundle.js"
Cohesion: 0.06
Nodes (31): au(), B(), be(), du(), fn(), fu(), hi(), hu() (+23 more)

### Community 4 - "models.py"
Cohesion: 0.13
Nodes (20): Manual, ManualChunk, ManualMetadata, ProjectTransformation, extraer_inventario_con_vision(), extraer_metadata_con_groq(), extraer_y_trocear_pdf(), rasterizar_paginas() (+12 more)

### Community 5 - "app.py"
Cohesion: 0.11
Nodes (17): errorhandler, limit, setup_admin(), This is an example command "insert-test-users" that you can run from the…, setup_commands(), User, login(), route (+9 more)

### Community 6 - "nu"
Cohesion: 0.16
Nodes (22): bi(), bu(), ca(), ei(), eu(), gu(), Hl(), Ji() (+14 more)

### Community 7 - "devDependencies"
Cohesion: 0.10
Nodes (21): autoprefixer, eslint, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-react-refresh, devDependencies, autoprefixer, eslint (+13 more)

### Community 8 - "chat.py"
Cohesion: 0.17
Nodes (17): construir_info_manual_para_groq(), construye el contexto completo del proyecto para groq. prioridad: inventario…, analyze_image(), analiza una imagen usando claude haiku con visión real. - descarga desde…, redimensiona la imagen a máximo 1024px en el lado mayor manteniendo proporción.…, redimensionar_imagen(), ChatHistory, construir_contexto_vision() (+9 more)

### Community 9 - "ao"
Cohesion: 0.18
Nodes (19): aa(), ao(), ba(), cu(), da(), Do(), fo(), Go() (+11 more)

### Community 10 - "ot"
Cohesion: 0.19
Nodes (19): An(), at(), dt(), Er(), ft(), Gt(), it(), Je() (+11 more)

### Community 11 - "conversation_context_service.py"
Cohesion: 0.18
Nodes (17): buscar_proyectos_anteriores(), construir_consulta_enriquecida(), construir_contexto_conversacion(), construir_contexto_metadata(), detectar_nivel_asistencia(), detectar_tipo_pregunta(), es_referencia_conversacional(), es_referencia_proyecto_anterior() (+9 more)

### Community 12 - "Zo"
Cohesion: 0.16
Nodes (18): Ce(), dn(), Ee(), en(), ge(), In(), ln(), mi() (+10 more)

### Community 13 - "main.jsx"
Cohesion: 0.21
Nodes (7): BackendURL(), StoreContext, StoreProvider(), temaGuardado, router, initialStore(), storeReducer()

### Community 14 - "dependencies"
Cohesion: 0.15
Nodes (13): lucide-react, dependencies, lucide-react, prop-types, react, react-dom, react-markdown, react-router-dom (+5 more)

### Community 15 - "package.json"
Cohesion: 0.17
Nodes (11): author, name, url, contributors, description, engines, node, license (+3 more)

### Community 16 - "yu"
Cohesion: 0.20
Nodes (12): Ae(), ci(), cn(), di(), fi(), hn(), mu(), pi() (+4 more)

### Community 17 - "auth.py"
Cohesion: 0.24
Nodes (7): UserProfile, get_profile(), jwt_required, route, devuelve el perfil del onboarding del usuario, guarda o actualiza el perfil del onboarding en BD, save_profile()

### Community 18 - "fl"
Cohesion: 0.22
Nodes (10): bl(), fl(), ho(), Ie(), kl(), Le(), Ma(), mo() (+2 more)

### Community 19 - "migrations/env.py"
Cohesion: 0.39
Nodes (7): get_engine(), get_engine_url(), get_metadata(), Run migrations in 'offline' mode. This configures the context with just a URL…, Run migrations in 'online' mode. In this scenario we need to create an Engine…, run_migrations_offline(), run_migrations_online()

### Community 20 - "ii"
Cohesion: 0.25
Nodes (8): ai(), bn(), ii(), Lt(), t(), oi(), pa(), wu()

### Community 21 - "sl"
Cohesion: 0.32
Nodes (8): fa(), gl(), ia(), na(), ou(), sl(), ua(), xu()

### Community 22 - "src/migrations/env.py"
Cohesion: 0.39
Nodes (7): get_engine(), get_engine_url(), get_metadata(), Run migrations in 'offline' mode. This configures the context with just a URL…, Run migrations in 'online' mode. In this scenario we need to create an Engine…, run_migrations_offline(), run_migrations_online()

### Community 23 - "send_message"
Cohesion: 0.33
Nodes (5): Exception, envía un mensaje a groq con todas las capas de contexto., función legacy — mantenida por compatibilidad. la visión real ahora pasa por…, send_image_message(), send_message()

### Community 24 - "babel"
Cohesion: 0.33
Nodes (6): babel, plugins, presets, @babel/plugin-proposal-class-properties, @babel/preset-env, @babel/preset-react

### Community 25 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, preview, start

### Community 26 - "El"
Cohesion: 0.50
Nodes (5): El(), ni(), ve(), wl(), ye()

### Community 27 - "pt"
Cohesion: 0.50
Nodes (5): Ht(), Kt(), on(), pt(), ut()

### Community 28 - "storage_service.py"
Cohesion: 0.40
Nodes (4): delete_file(), sube un archivo a cloudinary y devuelve la url publica file_content: el…, elimina un archivo de cloudinary por su public_id lo usaremos cuando el usuario…, upload_file()

### Community 29 - "database.sh"
Cohesion: 0.83
Nodes (3): creating_migration(), migrate_upgrade(), database.sh script

## Knowledge Gaps
- **49 isolated node(s):** `ACCIONES`, `PAREDES`, `PRODUCTOS`, `ACCIONES_MENU`, `ESTADOS` (+44 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Project` connect `Project` to `chat.py`, `conversation_context_service.py`, `models.py`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `APIException` connect `Project` to `chat.py`, `auth.py`, `app.py`, `send_message`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `sa()` connect `o` to `bundle.js`, `nu`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `o()` (e.g. with `ga()` and `i()`) actually correct?**
  _`o()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `n()` (e.g. with `bl()` and `D()`) actually correct?**
  _`n()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 15 inferred relationships involving `l()` (e.g. with `ga()` and `i()`) actually correct?**
  _`l()` has 15 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `Project` (e.g. with `buscar_proyectos_anteriores()` and `construir_contexto_conversacion()`) actually correct?**
  _`Project` has 21 INFERRED edges - model-reasoned connections that need verification._