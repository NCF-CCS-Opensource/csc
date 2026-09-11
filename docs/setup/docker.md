# Local Development & Testing with Docker and Supabase

This guide explains how to run and test the CCS Attendance system locally using Docker and Supabase.

Supabase is used strictly for Postgres database and Storage (identity is handled by Clerk, per ADR-0012).

---

## 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed and running.
- Node.js >= 22.13 and pnpm 11.13.1 (`corepack enable && corepack prepare pnpm@11.13.1 --activate`).

---

## 2. Quickstart (Supabase CLI)

The Supabase CLI is already integrated into the repository via `supabase/config.toml`. It manages the official Supabase Docker container stack.

### Step 1: Start the local Supabase containers

```bash
pnpm supabase:start
```

This boots the local Supabase environment:
- **Postgres Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **Supabase Studio (Web UI)**: [http://localhost:54323](http://localhost:54323)
- **API Gateway / Storage**: [http://localhost:54321](http://localhost:54321)
- **Inbucket (Email)**: [http://localhost:54324](http://localhost:54324)

### Step 2: Apply Drizzle migrations

```bash
pnpm db:migrate:local
```

### Step 3: Seed initial test data

```bash
pnpm db:seed:local
```

This populates sample student records and default programs (`Computer Science`, `Information Technology`, `Information Systems`, `Associate in Computer Technology`).

### Step 4: Verify in Supabase Studio

Open [http://localhost:54323](http://localhost:54323) in your browser to inspect tables (`students`, `programs`, `events`, `scans`, etc.) and run queries via SQL Editor.

### Step 5: Run the Web App locally

Create your `.env` file (or symlink `.env.docker`):

```bash
cp .env.docker .env
```

Start Next.js development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

To stop the Supabase containers when finished:

```bash
pnpm supabase:stop
```

---

## 3. Quickstart (Docker Compose)

If you prefer standard Docker Compose without using the Supabase CLI:

### Start Database & Supabase Studio only

```bash
pnpm docker:db
# or: docker compose up -d db studio meta
```

### Start the Full Stack (Database + Studio + Next.js Web App)

```bash
pnpm docker:up
# or: docker compose up -d
```

### Run Migrations & Seed against Docker Compose DB

```bash
pnpm db:migrate:local
pnpm db:seed:local
```

### View Logs

```bash
pnpm docker:logs
```

### Stop Containers

```bash
pnpm docker:down
# or: docker compose down
```

---

## 4. Building the Web Application Docker Image

To build the standalone production Docker image for `apps/web`:

```bash
pnpm docker:build
# or: docker build -t csc-web .
```

To run the container directly:

```bash
docker run -d --name csc-web \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:54322/postgres" \
  -e CLERK_SECRET_KEY="sk_test_..." \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..." \
  --add-host=host.docker.internal:host-gateway \
  csc-web:latest
```

---

## 5. Port Reference Table

| Service | Container Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Postgres Database** | `5432` | `54322` | Local DB for Drizzle ORM migrations and runtime queries |
| **Supabase Studio** | `3000` | `54323` | Web UI for Table Editor, SQL query runner, and schema viewer |
| **API Gateway (Kong)** | `8000` | `54321` | PostgREST / Storage S3 gateway |
| **Mailpit / Inbucket** | `8025` | `54324` | Local email capture UI |
| **Next.js Web App** | `3000` | `3000` | Web application and API routes |

---

## 6. Helper Commands Summary

```bash
# Supabase CLI commands
pnpm supabase:start       # Start Supabase Docker containers
pnpm supabase:stop        # Stop Supabase Docker containers
pnpm supabase:status      # Show URLs and status of Supabase services

# Database commands
pnpm db:migrate:local     # Apply Drizzle migrations to local Docker DB
pnpm db:seed:local        # Seed sample students into local Docker DB

# Docker Compose commands
pnpm docker:up            # Start all services (db, studio, meta, web)
pnpm docker:db            # Start db, studio, and meta only
pnpm docker:down          # Stop and remove containers
pnpm docker:build         # Build the web container image
pnpm docker:logs          # Follow container logs
```
