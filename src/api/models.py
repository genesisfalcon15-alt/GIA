from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
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

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "role": self.role,
            "is_pro": self.is_pro,
        }


class Project(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # quien es dueno del montaje
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    user: Mapped[User] = relationship(back_populates="projects")

    # titulo nullable porque lo genera groq en el primer mensaje
    title: Mapped[str] = mapped_column(String(255), nullable=True)

    # en progreso, completado, pausado
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="en_progreso")

    # relacion con Manual
    manuals: Mapped[list["Manual"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    # relacion con ChatHistory
    chat_history: Mapped[list["ChatHistory"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def serialize(self):
        ultimo = None
        if self.chat_history:
            ultimo_entry = max(self.chat_history, key=lambda m: m.created_at)
            ultimo = ultimo_entry.gia_response

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

    # cadena de seguridad: user -> project -> manual
    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped[Project] = relationship(back_populates="manuals")

    # url en cloudinary donde guardamos el pdf
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # nombre original del archivo para mostrar al usuario
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)

    # procesando, listo, error
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="procesando")

    # cuantos fragmentos generamos del manual
    total_chunks: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)

    # relacion con ManualChunk
    chunks: Mapped[list["ManualChunk"]] = relationship(back_populates="manual", cascade="all, delete-orphan")

    # relacion con ManualMetadata (uno a uno)
    manual_metadata: Mapped[Optional["ManualMetadata"]] = relationship(back_populates="manual", cascade="all, delete-orphan", uselist=False)
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

    # el texto del fragmento
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # vector de busqueda semántica
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=True)

    # de que pagina viene
    page_number: Mapped[int] = mapped_column(Integer(), nullable=True)

    # orden dentro del manual
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


class ManualMetadata(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    # relacion uno a uno con el manual
    manual_id: Mapped[int] = mapped_column(ForeignKey("manual.id"), nullable=False, unique=True)
    manual: Mapped["Manual"] = relationship(back_populates="manual_metadata")

    # herramientas necesarias extraidas del manual
    tools_required: Mapped[list] = mapped_column(JSON, nullable=True)

    # lista de piezas del mueble
    parts_list: Mapped[list] = mapped_column(JSON, nullable=True)

    # tornilleria y elementos de fijacion
    hardware_list: Mapped[list] = mapped_column(JSON, nullable=True)

    # numero total de pasos del montaje
    total_steps: Mapped[int] = mapped_column(Integer(), nullable=True)

    # advertencias de seguridad importantes
    safety_warnings: Mapped[list] = mapped_column(JSON, nullable=True)

    # tiempo estimado de montaje (ej: "45-60 minutos")
    estimated_time: Mapped[str] = mapped_column(String(100), nullable=True)

    # nivel de dificultad: facil, medio, dificil
    difficulty: Mapped[str] = mapped_column(String(30), nullable=True)

    # timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "manual_id": self.manual_id,
            "tools_required": self.tools_required,
            "parts_list": self.parts_list,
            "hardware_list": self.hardware_list,
            "total_steps": self.total_steps,
            "safety_warnings": self.safety_warnings,
            "estimated_time": self.estimated_time,
            "difficulty": self.difficulty,
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

    # ids de los chunks que uso para responder
    chunks_used: Mapped[list[int]] = mapped_column(JSON, nullable=True)

    # cuantos tokens gaste en esta llamada
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