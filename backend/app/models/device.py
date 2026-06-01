from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import DeviceType, enum_values


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[str] = mapped_column(primary_key=True)
    device_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    device_type: Mapped[DeviceType] = mapped_column(
        Enum(DeviceType, native_enum=False, values_callable=enum_values),
        nullable=False,
    )
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
