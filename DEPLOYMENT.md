# Production Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- A server with at least 1 GB RAM
- Domain name (optional, recommended for HTTPS)

## Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd logistics-system

# 2. Create production environment file
cp .env.production.example .env.production

# 3. Edit .env.production with your values
#    - Set NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
#    - Set NEXTAUTH_URL to your domain
#    - Set POSTGRES_PASSWORD to a strong password
#    - Configure SMTP/Telegram/Zalo as needed

# 4. Build and start all services
docker compose up -d --build

# 5. Run database migrations
docker compose exec app npx prisma migrate deploy

# 6. (Optional) Seed initial data
docker compose exec app npx prisma db seed

# 7. Verify health
curl http://localhost/api/health
```

## Architecture

```
                 ┌──────────┐
  HTTP :80  ───> │  nginx   │
                 └────┬─────┘
                      │
                 ┌────▼─────┐
                 │  Next.js  │ :3000
                 └────┬─────┘
                      │
                 ┌────▼─────┐
                 │ Postgres  │ :5432
                 └──────────┘
```

- **nginx** — reverse proxy, serves uploaded images directly from volume
- **Next.js** — application server (standalone output)
- **PostgreSQL 16** — database with persistent volume

## Services

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80 (configurable via `HTTP_PORT`) | Reverse proxy |
| app | 3000 (internal) | Next.js application |
| db | 5432 (internal) | PostgreSQL database |

## Persistent Volumes

| Volume | Purpose |
|--------|---------|
| `pgdata` | PostgreSQL data |
| `uploads` | Package images (`/app/public/uploads` in app, `/data/uploads` in nginx) |

## Health Checks

- **App:** `GET /api/health` — returns `{"status":"ok","database":"ok"}` or `503` if database is unreachable
- **nginx:** `GET /nginx-health` — returns `200 ok`
- **Database:** `pg_isready` command

## Common Operations

```bash
# View logs
docker compose logs -f app
docker compose logs -f nginx

# Restart a service
docker compose restart app

# Run database migrations after code update
docker compose exec app npx prisma migrate deploy

# Rebuild after code changes
docker compose up -d --build

# Stop all services
docker compose down

# Stop and remove volumes (destructive!)
docker compose down -v
```

## HTTPS Setup

For production HTTPS, add a reverse proxy (Caddy, Traefik, or certbot with nginx) in front of the nginx service, or modify `nginx/nginx.conf` to include SSL certificates.

Camera barcode scanning requires HTTPS (`getUserMedia` browser requirement).

## Backup

```bash
# Database backup
docker compose exec db pg_dump -U postgres logistics > backup.sql

# Database restore
docker compose exec -T db psql -U postgres logistics < backup.sql
```

## Troubleshooting

1. **App won't start:** Check `docker compose logs app` for errors. Ensure `.env.production` exists.
2. **Database connection failed:** Ensure the `db` service is healthy: `docker compose ps`.
3. **Uploads not showing:** Verify the `uploads` volume is mounted correctly in both `app` and `nginx` services.
4. **Health check returns 503:** Database is unreachable. Check `docker compose logs db`.
