# Local Supabase via Docker Compose

Runs the local backend without `supabase start`, using only the services the app needs.

| Service | Image | Port |
|---|---|---|
| Caddy gateway | `caddy:2-alpine` | 54321 → `/auth/v1`, `/rest/v1` |
| Postgres | `supabase/postgres:17.11.0.006` | 54322 |
| Auth (GoTrue) | `supabase/gotrue:v2.197.0` | internal 9999 |
| REST (PostgREST) | `postgrest/postgrest:v16.5` | internal 3000 |
| Meta | `supabase/postgres-meta:v0.100.0` | internal 8080 |
| Studio | `supabase/studio:2026.10.19` | 54323 |

Not included (add later only if needed): storage, imgproxy, realtime, edge functions, analytics, pooler, mailpit.

## Commands

```sh
bun run db:up      # docker compose up -d
bun run db:down    # docker compose down (keeps data)
bun run db:reset   # drop volumes, recreate, re-run init
bun run db:logs    # follow logs
bun run db:types   # generate TS types from the local DB
```

## Connection values

```
API      http://127.0.0.1:54321
DB       postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio   http://127.0.0.1:54323
```

Copy `.env.example` to `.env` for the Expo app.

## Notes

- Credentials here are the public Supabase local defaults. Never reuse them in production.
- `docker/db/init/99-z-local-passwords.sql` sets passwords for the service roles; it only runs on a fresh `db-data` volume.
- The Supabase CLI is still installed for `gen types` and migrations against this stack (`--db-url`). `supabase start` is no longer required.
- Studio may show a 307 redirect to `/project/default`; that is expected.
