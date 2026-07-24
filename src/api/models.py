from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    # vacio a proposito, para cuando meta login con google
    password: Mapped[str] = mapped_column(String(256), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)

    # particular o profesional
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="particular")

    # listo para el stripe pro
    is_pro: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=False)

    # controlo el limite gratis de groq
    daily_message_count: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    last_message_date: Mapped[str] = mapped_column(String(10), nullable=True)

    # relacion con Project: un user tiene muchos montajes
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    # guardo la contraseña encriptada, nunca tal cual
    def set_password(self, password):
        self.password = generate_password_hash(password)

    # compruebo la contraseña en el login
    def check_password(self, password):
        return check_password_hash(self.password, password)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "is_pro": self.is_pro,
            # el password no se saca nunca
        }


class Project(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # quien es dueno del montaje, aqui se verifica si puede acceder o no
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    user: Mapped[User] = relationship(back_populates="projects")

    # titulo de la conversacion, nullable porque se genera automaticamente
    # cuando el usuario manda el primer mensaje, groq genera el titulo
    # hasta entonces queda en null
    title: Mapped[str] = mapped_column(String(255), nullable=True)

    # en progreso, completado, pausado
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="en_progreso")

    # relacion con Manual: cada montaje puede tener su manual
    manuals: Mapped[list["Manual"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    # relacion con ChatHistory: todas las conversaciones de este montaje
    chat_history: Mapped[list["ChatHistory"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # serialize pensado para el sidebar de conversaciones
    # el frontend nunca ve la palabra "project", solo ve "conversacion"
    def serialize(self):
        # saco el ultimo mensaje para mostrarlo en el sidebar
        ultimo = None
        if self.chat_history:
            ultimo_entry = max(self.chat_history, key=lambda m: m.created_at)
            ultimo = ultimo_entry.gia_response

        # miro si tiene algun manual subido
        tiene_manual = len(self.manuals) > 0

        return {
            "id": self.id,
            "title": self.title or "Nueva conversación",
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_message": ultimo,
            "has_manual": tiene_manual,
            "message_count": len(self.chat_history),
        }


class Manual(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # cadena de seguridad: user -> project -> manual, imposible acceder sin permiso
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped[Project] = relationship(back_populates="manuals")

    # url en cloudinary donde guardamos el pdf
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # nombre original del archivo para mostrar al usuario
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # procesando, listo, error, o error_no_digital si es solo imagenes
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="procesando")

    # cuantos fragmentos generamos del manual (para la ui)
    total_chunks: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)

    # relacion con ManualChunk: los trozos trocados del manual
    chunks: Mapped[list["ManualChunk"]] = relationship(back_populates="manual", cascade="all, delete-orphan")

    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "original_filename": self.original_filename,
            "status": self.status,
            "total_chunks": self.total_chunks,
            "created_at": self.created_at.isoformat(),
        }


class ManualChunk(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # a que manual pertenece este fragmento
    manual_id: Mapped[int] = mapped_column(ForeignKey("manual.id"), nullable=False)
    manual: Mapped[Manual] = relationship(back_populates="chunks")

    # el texto del fragmento (puede ser largo, por eso Text)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # vector de busqueda, numeros que representan el significado del fragmento
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=True)

    # de que pagina viene (si el pdf tiene paginas)
    page_number: Mapped[int] = mapped_column(Integer(), nullable=True)

    # en que orden va el fragmento dentro del manual (paso 1, paso 2, etc)
    chunk_index: Mapped[int] = mapped_column(Integer(), nullable=False)

    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "manual_id": self.manual_id,
            "content": self.content,
            "page_number": self.page_number,
            "chunk_index": self.chunk_index,
        }


class ChatHistory(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # a que montaje pertenece esta conversacion
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped[Project] = relationship(back_populates="chat_history")

    # lo que pregunto el usuario
    user_message: Mapped[str] = mapped_column(Text, nullable=False)

    # lo que contesto gia
    gia_response: Mapped[str] = mapped_column(Text, nullable=False)

    # ids de los chunks que uso para responder, asi el frontend los resalta
    chunks_used: Mapped[list[int]] = mapped_column(JSON, nullable=True)

    # cuantos tokens gaste en esta llamada (para auditar costos)
    tokens_used: Mapped[int] = mapped_column(Integer(), nullable=True)

    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user_message": self.user_message,
            "gia_response": self.gia_response,
            "chunks_used": self.chunks_used,
            "tokens_used": self.tokens_used,
            "created_at": self.created_at.isoformat(),
        }