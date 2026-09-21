# Local Development & Testing with Docker

This guide explains how to run and test the CCS Attendance system locally using Docker.

---

## 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose installed and running.
- Node.js >= 22.13 and pnpm 11.13.1 (`corepack enable && corepack prepare pnpm@11.13.1 --activate`).

---

## 2. Quickstart (Docker Compose)

### Start Database only

```bash
pnpm docker:db
# or: docker compose up -d db
```

### Start the Full Stack (Database + Next.js Web App)

```bash
pnpm docker:up
# or: docker compose up -d
```

### Apply Drizzle migrations & seed

```bash
pnpm db:migrate:local
pnpm db:seed:local

# OR import all 513 official enrollment roster rows from Enrollment List.xlsx:
pnpm db:import-roster:local

# (Optional) Populate all 513 roster students directly into the `students` table for UI testing:
pnpm db:seed-all:local
```

This populates the default programs (`Computer Science`, `Information Technology`, `Information System`, `ACT`) and the 513 student roster records.

### Run the Web App locally

Create your `.env` file (or symlink `.env.docker`):

```bash
cp .env.docker .env
```

Start Next.js development server:

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000).

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

## 3. Building the Web Application Docker Image

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

## 4. Port Reference Table

| Service | Container Port | Host Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Postgres Database** | `5432` | `54322` | Local DB for Drizzle ORM migrations and runtime queries |
| **Next.js Web App** | `3000` | `3000` | Web application and API routes |

---

## 5. Helper Commands Summary

```bash
# Database commands
pnpm db:migrate:local       # Apply Drizzle migrations to local Docker DB
pnpm db:seed:local          # Seed 3 sample students into local Docker DB
pnpm db:import-roster:local # Import all 513 enrollment rows from Enrollment List.xlsx
pnpm db:seed-all:local      # Sync all 513 roster students into students table

# Docker Compose commands
pnpm docker:up            # Start all services (db, web)
pnpm docker:db            # Start db only
pnpm docker:down          # Stop and remove containers
pnpm docker:build         # Build the web container image
pnpm docker:logs          # Follow container logs
```
