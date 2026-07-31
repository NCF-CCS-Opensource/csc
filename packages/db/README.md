# Database integration tests

From the repository root, run:

```bash
pnpm test:integration
```

Docker starts a disposable local Postgres container, applies every committed
migration through the existing Drizzle setup, runs the integration checks, and
removes the container. The command ignores `DATABASE_URL`, and the checks reject
non-local `TEST_DATABASE_URL` values so production cannot be targeted silently.
