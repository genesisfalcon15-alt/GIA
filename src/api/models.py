from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
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