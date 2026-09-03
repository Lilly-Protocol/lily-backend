# Migrating from API v1 to v2

> **Status:** Placeholder migration guide. API v2 is not currently available. Replace the placeholders below with concrete breaking changes before v2 is released.

Lily Backend uses URL path versioning. The existing `/api/v1` routes remain available while a breaking `/api/v2` version is introduced, and v1 must remain unchanged during the migration window.

## Migration process

1. **Create the v2 router.** Add `src/routes/v2/index.ts` and define the new v2 router there.
2. **Mount v2 alongside v1.** Register the router in `src/app.ts` with `app.use("/api/v2", apiV2Router)`.
3. **Preserve v1 compatibility.** Keep the existing v1 routes unchanged so current clients continue to work during the migration period.
4. **Document client migration details here.** Before releasing v2, replace this placeholder with the breaking-change inventory, old-to-new request/response mappings, migration examples, and any client actions required to move from v1 to v2.

## Deprecation notice

Deprecation timing is announced in [`CHANGELOG.md`](../../CHANGELOG.md). Any retirement of v1 must preserve the project's documented minimum six-month notice period.

When v2 is prepared, this guide should record at least:

- affected endpoints and behaviors;
- before/after request and response examples;
- required configuration or client-code changes;
- rollout and rollback considerations;
- the deprecation announcement date and earliest supported removal date, mirrored in the changelog.
