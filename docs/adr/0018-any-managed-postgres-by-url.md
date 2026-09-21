# Any managed Postgres addressed by URL, hosted on Heroku for now

Status: accepted. Supersedes the Postgres-hosting portion of ADR-0001, including its consequence that *"Supabase is a lock-in point for Postgres hosting"* — that lock-in never materialized.

The database is reached only through `DATABASE_URL` and the standard `postgres-js` driver. No provider SDK, no BaaS client, no provider-specific feature. **Heroku Postgres Essential-0 is the host chosen now**, because Supabase's free tier pauses inactive projects after seven days and waking one by hand before a demo is not an operating model. The provider is a configuration value, not an architectural commitment: Aiven, Neon, Railway, RDS, Render, DigitalOcean or a self-hosted container all satisfy the same contract.

This was already true when the decision was made — `createDb(connectionString)` was the whole integration — so this ADR mostly records a property worth *not breaking* rather than one being built. The one thing that did break it: `postgres(connectionString, { prepare: false })` hardcoded a Supabase Supavisor pooler requirement into shared code. `prepare` becomes a `createDb` option defaulting to `true`, set to `false` only when actually behind a transaction pooler. TLS stays in the connection string, where `postgres-js` reads `?sslmode=` directly (`no-verify` for Heroku's self-signed certificates, `require` for Aiven and Supabase).

## Considered Options

- **A provider abstraction layer, or an adapter per provider** — rejected: the connection string already *is* the abstraction, and Clean Architecture's repository interfaces (ADR-0017) isolate persistence a full layer above where a host swap happens. An abstraction over an abstraction buys nothing.
- **Portability across database *engines* (MySQL, SQLite)** — rejected: the schema uses six `pgEnum`s, `uuid().defaultRandom()`, `timestamp withTimezone`, and a Postgres constraint enforcing at-most-one-open-Semester. Engine portability would trade an invariant the database itself makes impossible to violate for flexibility that will almost certainly never be exercised, since every provider on the list offers Postgres.
- **A CI job proving the suite against a second provider** — rejected: the integration tests already run against a disposable Postgres, which demonstrates provider independence for free.
- **Staying on Supabase's paid tier** — rejected on cost, against a budget that already existed for Heroku.

## Consequences

- Essential-0 caps at **20 connections** and Heroku reserves some of them. The Drizzle pool is capped at **10**, leaving room for `db:migrate`, Drizzle Studio and a `psql` session without locking yourself out of your own database during an incident.
- Prepared statements are re-enabled on direct connections — free performance that Supavisor had been forbidding.
- Changing provider is: new `DATABASE_URL`, `pnpm db:migrate`, re-run the enrollment roster importer. No code change, no ADR.
- `packages/db/scripts/*.mjs` read `DATABASE_URL` directly and need the new URL with its `sslmode` parameter.
- Only one environment is provisioned (production). Local `docker-compose.yml` serves as staging; the CI workflows still reference a staging environment that does not exist and need updating.
