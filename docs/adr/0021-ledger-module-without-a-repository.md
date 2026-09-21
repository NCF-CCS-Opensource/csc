# Ledger is a module without a repository, and no-show materialization is a command

`modules/ledger` owns the derived read model behind the Student dashboard, Clearance and Reports. It has **no table and no repository of its own** — it composes the repositories of `event`, `attendance`, `penalty` and `payment`. This matches what `CONTEXT.md` already says a Ledger is: *"Not a stored table; derived on read... The single read model behind the dashboard, Clearance, and Analytics."*

Separately, materializing no-show Penalty rows becomes an explicit `MaterializeEventNoShowsUseCase`, invoked by the attendance-table controller **before** it queries, rather than a write buried inside `studentLedger()`. The behavior is unchanged — `CONTEXT.md` still governs *when* rows are written — but the write stops pretending to be a read.

## Considered Options

- **Fold the Ledger into `penalty`** — rejected: three separate surfaces depend on it counting no-shows identically, and burying it inside one of its consumers is how they drift apart.
- **A shared domain service outside the module structure** — rejected: the glossary already treats Ledger as a first-class concept, so the module structure should too.
- **Leaving materialization implicit inside the read** — rejected: a query with a hidden write survives exactly as long as it has one caller. It had three consumers at the time of this decision and would rot at the fourth.

## Consequences

- A module with no repository looks wrong to anyone applying the resource template mechanically. It is deliberate: `pnpm generate:resource` should not be used to scaffold `ledger`.
- Callers that record Payment must invoke materialization explicitly. Forgetting to is now a visible omission at the call site rather than an invisible behavior change.
- `CONTEXT.md`'s definition of Ledger needs no amendment — this decision implements it rather than changing it.
