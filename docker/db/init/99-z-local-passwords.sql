-- Local-only: give the service roles a password that matches POSTGRES_PASSWORD.
-- The Supabase image creates the roles without usable passwords; the CLI injects
-- them at runtime. This script keeps the compose stack self-contained.
-- Never use these credentials outside local development.

alter role authenticator with login password 'postgres';
alter role supabase_auth_admin with login password 'postgres';
alter role supabase_storage_admin with login password 'postgres';
alter role supabase_admin with login password 'postgres';
