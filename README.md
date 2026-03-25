# simple-REST-API

TypeScript REST API with Express, PostgreSQL, and Docker.

## Prerequisites

- [Node.js](https://nodejs.org/) (for local development)
- [Docker](https://www.docker.com/) and Docker Compose (for containerized run)

## Run with Docker

From the project root:

```bash
docker compose up --build
```

The API listens on [http://localhost:3000](http://localhost:3000). PostgreSQL is exposed on port `5432` on the host.

The app waits for the database to accept connections (with retries) before running migrations and starting the server.

## Configuration

Environment variables are read from the process environment. For local runs, copy [`.env.example`](.env.example) to `.env` and fill in values (`.env` is gitignored).

The app loads `.env` automatically in development via `dotenv` (see `src/index.ts`).

## Local development (without Docker)

1. Have PostgreSQL reachable (local install or a managed host such as Aiven).
2. Install dependencies: `npm install`
3. Configure `.env` (see [`.env.example`](.env.example)) or export variables in your shell.
4. Start: `npm run dev`

Build and run compiled output:

```bash
npm run build
npm start
```

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create a project |
| GET | `/projects/:id` | Get a project |
| PUT | `/projects/:id` | Update a project |
| DELETE | `/projects/:id` | Delete a project |
| GET | `/projects/:id/tasks` | Tasks linked to a project |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task |
| GET | `/tasks/:id` | Get a task |
| PUT | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| GET | `/tasks/tag/:tag` | Tasks that include a tag |
| POST | `/tasks/:id/projects` | Assign task to project (body: `{ "projectId": number }`) |

**REST notes:** Resources are grouped under `/projects` and `/tasks`. The many-to-many link is created with `POST /tasks/:id/projects` (task-centric assign). Nested `GET /projects/:id/tasks` lists tasks for a project.

## Architectural decisions

- **Stack:** TypeScript, Express, and the `pg` driver with **parameterized SQL** (no ORM) to keep the codebase small and explicit.
- **Layers:** HTTP wiring lives in `routes/`, request handling in `controllers/`, and persistence in SQL against a shared `Pool` in `db.ts`.
- **Schema:** Tables are created on startup in `migrate.ts` (`CREATE TABLE IF NOT EXISTS`). A **`project_tasks`** join table implements the **many-to-many** between projects and tasks, with `ON DELETE CASCADE` so links disappear when a parent row is removed.
- **Operations:** `waitForDb()` retries the database connection so `docker compose up` is reliable when Postgres is still starting.
- **Configuration:** `dotenv` loads `.env` for local runs; Docker injects variables via `docker-compose.yml` (the image does not rely on copying `.env` into the container).

## Assumptions and trade-offs

- **Validation:** Request bodies are not fully validated (e.g. missing `name` on create may surface as a database error). Acceptable for a small exercise; production code would use a schema library or manual checks.
- **Migrations:** Schema is applied with idempotent SQL on boot, not a versioned migration tool (e.g. Flyway). Fine for a demo; larger apps need migration history and rollbacks.
- **Assigning tasks to projects:** There is no `DELETE` to remove a single task–project link; deleting a project or task relies on cascade rules. Adding an “unassign” endpoint would be a natural extension.
- **Remote databases:** Optional support for managed Postgres (e.g. Aiven) with TLS/CA is implemented for local development; **`docker compose`** in this repo targets the **bundled Postgres service** by default.

## Project layout

```
src/
  index.ts              # App entry
  db.ts                 # PostgreSQL pool + wait for DB
  migrate.ts            # Schema creation
  routes/               # Route definitions
  controllers/          # Handlers
```
