-- =============================================================================
-- Inicialización del PostgreSQL LOCAL (modo Docker)
-- =============================================================================
-- Este script SOLO se ejecuta la primera vez que se crea el volumen `pgdata`
-- (Postgres corre todo lo que esté en /docker-entrypoint-initdb.d/ en el
-- primer arranque sobre una base de datos vacía).
--
-- Propósito:
--  1. Crear los roles que la migración 0001_initial_schema espera encontrar.
--     0001 hace REVOKE/GRANT sobre `anon`, `authenticated` y `service_role`
--     (roles propios del stack de Supabase). En un Postgres vanilla no existen
--     y la migración fallaría, así que los creamos aquí como roles NOLOGIN.
--  2. Crear el rol `supabase_auth_admin` y el esquema `auth` que usa GoTrue
--     (contenedor `gotrue`) para sus propias tablas de autenticación.
-- =============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
        CREATE ROLE supabase_auth_admin NOLOGIN;
    END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
