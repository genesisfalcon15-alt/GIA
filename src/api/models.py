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
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

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

    # relacion con Project
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    # relacion con UserTool: caja de herramientas del usuario
    tools: Mapped[list["UserTool"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
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

    # en_progreso, completado, pausado, cancelado
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="en_progreso")

    # montaje, instalacion, restauracion, reparacion, libre
    category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # porcentaje de progreso del proyecto
    progress: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)

    # minutos invertidos en el proyecto
    time_invested: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)

    # extra_data flexible: brand, model, room, favorite, archived, color, etc.
    # evita migraciones cada vez que se añade un campo nuevo
    # NO usar "metadata" — es palabra reservada en SQLAlchemy
    extra_data: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True, default=dict)

    # relacion con Manual
    manuals: Mapped[list["Manual"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    # relacion con ChatHistory
    chat_history: Mapped[list["ChatHistory"]] = relationship(back_populates="project", cascade="all, delete-orphan")

    # relaciones con tablas del proyecto
    timeline: Mapped[list["ProjectTimeline"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    notes: Mapped[list["ProjectNote"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    photos: Mapped[list["ProjectPhoto"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    items: Mapped[list["ProjectItem"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    project_tools: Mapped[list["ProjectTool"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    transformations: Mapped[list["ProjectTransformation"]] = relationship(back_populates="project", cascade="all, delete-orphan")

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
            "category": self.category,
            "progress": self.progress,
            "time_invested": self.time_invested,
            "extra_data": self.extra_data or {},
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_message": ultimo,
            "has_manual": tiene_manual,
            "message_count": len(self.chat_history),
        }


class Manual(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped[Project] = relationship(back_populates="manuals")

    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="procesando")
    total_chunks: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)

    chunks: Mapped[list["ManualChunk"]] = relationship(back_populates="manual", cascade="all, delete-orphan")
    manual_metadata: Mapped[Optional["ManualMetadata"]] = relationship(back_populates="manual", cascade="all, delete-orphan", uselist=False)

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

    manual_id: Mapped[int] = mapped_column(ForeignKey("manual.id"), nullable=False)
    manual: Mapped[Manual] = relationship(back_populates="chunks")

    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list[float]] = mapped_column(JSON, nullable=True)
    page_number: Mapped[int] = mapped_column(Integer(), nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer(), nullable=False)

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

    manual_id: Mapped[int] = mapped_column(ForeignKey("manual.id"), nullable=False, unique=True)
    manual: Mapped["Manual"] = relationship(back_populates="manual_metadata")

    tools_required: Mapped[list] = mapped_column(JSON, nullable=True)
    parts_list: Mapped[list] = mapped_column(JSON, nullable=True)
    hardware_list: Mapped[list] = mapped_column(JSON, nullable=True)
    total_steps: Mapped[int] = mapped_column(Integer(), nullable=True)
    safety_warnings: Mapped[list] = mapped_column(JSON, nullable=True)
    estimated_time: Mapped[str] = mapped_column(String(100), nullable=True)
    difficulty: Mapped[str] = mapped_column(String(30), nullable=True)

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

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped[Project] = relationship(back_populates="chat_history")

    user_message: Mapped[str] = mapped_column(Text, nullable=False)
    gia_response: Mapped[str] = mapped_column(Text, nullable=False)
    chunks_used: Mapped[list[int]] = mapped_column(JSON, nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer(), nullable=True)

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


class ProjectTimeline(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="timeline")

    evento: Mapped[str] = mapped_column(String(300), nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False, default="info")

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "evento": self.evento,
            "tipo": self.tipo,
            "created_at": self.created_at.isoformat(),
        }


class ProjectNote(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="notes")

    content: Mapped[str] = mapped_column(Text, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }


class ProjectPhoto(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="photos")

    url: Mapped[str] = mapped_column(String(500), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "url": self.url,
            "caption": self.caption,
            "created_at": self.created_at.isoformat(),
        }


class UserTool(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False)
    user: Mapped["User"] = relationship(back_populates="tools")

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    brand: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="excelente")
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    date_added: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    last_used: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    project_count: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "brand": self.brand,
            "model": self.model,
            "status": self.status,
            "photo_url": self.photo_url,
            "date_added": self.date_added.isoformat(),
            "last_used": self.last_used.isoformat() if self.last_used else None,
            "project_count": self.project_count,
            "notes": self.notes,
        }


class ProjectTool(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="project_tools")

    user_tool_id: Mapped[int] = mapped_column(ForeignKey("user_tool.id"), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "user_tool_id": self.user_tool_id,
            "created_at": self.created_at.isoformat(),
        }


class ProjectItem(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="items")

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quantity_total: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    quantity_used: Mapped[int] = mapped_column(Integer(), nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="disponible")

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "name": self.name,
            "reference": self.reference,
            "quantity_total": self.quantity_total,
            "quantity_used": self.quantity_used,
            "quantity_remaining": self.quantity_total - self.quantity_used,
            "status": self.status,
        }


class ProjectTransformation(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("project.id"), nullable=False)
    project: Mapped["Project"] = relationship(back_populates="transformations")

    from_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    to_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "project_id": self.project_id,
            "from_type": self.from_type,
            "to_type": self.to_type,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
        }


class UserProfile(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), nullable=False, unique=True)

    experience_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    home_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    wall_types: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    tools_available: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    interests: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    help_style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    sector: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    team_size: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "experience_level": self.experience_level,
            "home_type": self.home_type,
            "wall_types": self.wall_types or [],
            "tools_available": self.tools_available or [],
            "interests": self.interests or [],
            "help_style": self.help_style,
            "sector": self.sector,
            "team_size": self.team_size,
        }