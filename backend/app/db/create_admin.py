from __future__ import annotations

import argparse
import asyncio
import uuid

import httpx

from app.core.config import get_settings
from app.db.session import session_context
from app.models.enums import StaffRole, StaffStatus
from app.repositories.staff import StaffRepository


async def create_admin(email: str, password: str, name: str | None) -> None:
    settings = get_settings()
    user_id = str(uuid.uuid4())

    if settings.supabase_url and settings.supabase_secret_key:
        print(f"Registrando usuario en Supabase: {email}...")
        try:
            async with httpx.AsyncClient() as client:
                supabase_url = settings.supabase_url.rstrip("/")
                response = await client.post(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers={
                        "apikey": settings.supabase_secret_key,
                        "Authorization": f"Bearer {settings.supabase_secret_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "email": email,
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {"display_name": name},
                    },
                )

            if response.status_code == 201:
                user_id = response.json()["id"]
                print(f"Usuario registrado en Supabase Auth con UUID: {user_id}")
            else:
                print(
                    "Advertencia/Error de Supabase Auth "
                    f"(Status {response.status_code}): {response.text}"
                )
                print("Se intentara proceder con la creacion de perfil local.")
        except httpx.HTTPError as exc:
            print(f"Error de conexion con Supabase Auth: {exc}")
            print(
                "Se intentara proceder con la creacion de perfil local usando un UUID local."
            )
    else:
        print("Supabase no esta completamente configurado en el archivo .env.")
        print("Procediendo con la creacion de perfil local (UUID generado al azar).")

    print(f"Registrando perfil de staff local en base de datos para {email}...")
    try:
        async with session_context() as session:
            repo = StaffRepository(session)
            existing = await repo.get_by_email(email)
            if existing:
                print(f"El perfil para {email} ya existe en base de datos.")
                print("Actualizando perfil a ADMIN y status a ACTIVE...")
                existing.role = StaffRole.ADMIN
                existing.status = StaffStatus.ACTIVE
                if name:
                    existing.display_name = name
                await session.commit()
                print("Perfil de administrador actualizado correctamente.")
            else:
                await repo.create(
                    user_id=user_id,
                    email=email,
                    display_name=name,
                    role=StaffRole.ADMIN,
                    status=StaffStatus.ACTIVE,
                )
                await session.commit()
                print(
                    f"Perfil de administrador {email} creado exitosamente en la base de datos."
                )
    except Exception as exc:
        print(f"Error al escribir en la base de datos local: {exc}")
        print("Asegurate de que la base de datos este activa y la URL en .env sea correcta.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Crear un usuario administrador en el sistema.")
    parser.add_argument("--email", required=True, help="Correo electronico del administrador")
    parser.add_argument("--password", required=True, help="Contrasena del administrador")
    parser.add_argument("--name", help="Nombre a mostrar del administrador")
    args = parser.parse_args()

    asyncio.run(create_admin(args.email, args.password, args.name))
