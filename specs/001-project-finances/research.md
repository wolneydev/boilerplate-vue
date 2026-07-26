# Phase 0 Research: Project Financial Management

## Existing application fit

### Decision
Implement the capability inside `src/modules/planning/`, using plain JavaScript,
Vue 3 `<script setup>`, Vue Router 4, and namespaced Vuex 4 modules.

### Rationale
Projects and tasks already belong to `planning`, and the constitution explicitly
permits that module to own their tightly coupled financial behavior. The application
already composes planning routes and Vuex modules at the root.

### Alternatives considered
- A separate top-level finance module: rejected because these funds, costs, and
  allocations cannot be used independently of planning projects and tasks.
- Pinia: rejected because Vuex is the current source of truth and the constitution
  prohibits an incremental Pinia migration.

## Store and service boundaries

### Decision
Add separate `funds`, `costs`, and `allocations` namespaced Vuex modules and matching
thin services. Keep shared money, date, and error-code helpers in
`src/modules/planning/types/finances.types.js`.

### Rationale
Each resource has independent loading, error, and pending states. Separate modules
match the existing `projects` and `tasks` pattern and prevent a cost request from
blocking a fund or allocation view. The allocation action can refresh authoritative
fund balances and task history through root dispatches.

### Alternatives considered
- One large finance store and service: rejected because unrelated request state would
  become coupled and the module would accumulate multiple resource lifecycles.
- Component-local server state: rejected because views must read through getters and
  mutate through actions.

## Navigation and page composition

### Decision
Add protected, lazy-loaded routes for:

- `/projects/:projectId/funds`
- `/projects/:projectId/costs`
- `/projects/:projectId/tasks/:taskId/finance`

Link the first two from `ProjectDetailPage.vue` and expose the task-finance route from
each task row. The task-finance page combines allocation entry and read-only history.

### Rationale
The routes make every user story independently reachable and testable without
overloading the existing project-detail page. Keeping the project identifier in the
task-finance route makes the fund boundary explicit; the backend remains responsible
for confirming that the task and selected fund belong to that project.

### Alternatives considered
- Embed every financial workflow in `ProjectDetailPage.vue`: rejected because the
  page already owns task and calendar behavior and would become difficult to test.
- Add a global finance area: rejected because the specification is project-scoped.

## API resource design

### Decision
Use nested Laravel-style resources:

- `GET|POST /projects/{projectId}/funds`
- `PUT /projects/{projectId}/funds/{fundId}`
- `GET|POST /projects/{projectId}/costs`
- `POST /tasks/{taskId}/financial-allocations`

The backend currently exposes no allocation-history listing route. The frontend may
show allocations embedded in a task response or confirmed by the current POST, but
persistent history across page reloads remains a backend dependency.

Require project responses to include an ISO 4217 `currency` code. Services unwrap the
existing `{ data: ... }` envelope and send snake_case payloads.

### Rationale
Nested routes express project ownership, while task allocations naturally address the
receiving task. They align with the current REST services and Laravel resource
envelopes.

### Alternatives considered
- A single `/finances` endpoint: rejected because it obscures ownership and creates a
  mixed response lifecycle.
- Client-only joins without scoped endpoints: rejected because authorization and
  project/task/fund relationship checks must be server-enforced.

## Money representation and arithmetic

### Decision
Keep API and form amounts as canonical base-10 decimal strings. Determine permitted
fraction digits from the project's ISO 4217 currency with `Intl.NumberFormat`, and
convert strings to integer minor units with string parsing and `BigInt` for validation
and comparison. Format display values with `Intl.NumberFormat`.

### Rationale
This avoids IEEE-754 rounding errors and preserves the specified transport shape.
Browser-native currency metadata and formatting avoid a new runtime dependency.

### Alternatives considered
- JavaScript `Number`: rejected for financial comparisons because decimal fractions
  are not represented exactly.
- A decimal arithmetic package: deferred because the required operations are limited
  to validation and comparison, which integer minor units cover safely.

## Dates and ordering

### Decision
Treat `incurred_on` as a `YYYY-MM-DD` date-only value and never construct a JavaScript
`Date` for it. Treat `recorded_at` as an ISO 8601 timestamp with an offset or `Z`, and
display it in the browser's local timezone. Preserve backend newest-first ordering.

### Rationale
This prevents a cost date from shifting across timezones while giving timestamps the
local-time behavior required by the specification.

### Alternatives considered
- Convert every value through `Date`: rejected because date-only values can move to a
  different calendar day.
- Sort histories only in the browser: rejected because server order is authoritative
  and should remain deterministic.

## Errors, concurrency, and refresh

### Decision
Recognize insufficient funds through `HttpError.data.code ===
"INSUFFICIENT_FUNDS"`. Keep client-side pending guards for duplicate interaction, but
require the allocation endpoint to perform its balance check and write atomically.
After successful writes, refetch the affected collection. After an insufficient-funds
response, refetch funds before allowing correction and retry.

### Rationale
Machine-readable discrimination is stable and localizable. UI guards improve
interaction but cannot protect against concurrent users; atomic backend enforcement
is required. Refetching follows the constitution's server-authoritative state rule.

### Alternatives considered
- Match the error message: rejected as brittle and incompatible with localization.
- Optimistically decrement balances: rejected because concurrent allocations can
  invalidate the displayed balance.

## Verification strategy

### Decision
Add Vitest, `@vue/test-utils`, and `happy-dom`, with `test` and `test:watch` scripts.
Cover money helpers and Vuex actions at unit level, services as mocked HTTP contract
tests, and financial forms/pages as component tests. Retain an end-to-end manual
quickstart because no browser E2E harness currently exists.

### Rationale
The repository has no automated test harness, but financial validation, duplicate
submission, error discrimination, and refresh orchestration require repeatable
verification. Vitest integrates directly with Vite and Vue Test Utils.

### Alternatives considered
- Manual testing only: rejected because it does not satisfy the constitution's
  lowest-effective-level automated coverage requirement for this behavior.
- Introduce a full browser E2E framework now: deferred because component, store, and
  contract tests cover the risky logic with less initial infrastructure.

## Package manager and environment safety

### Decision
Use npm as the authoritative package manager, update `package-lock.json` when adding
the test harness, and remove the stale `yarn.lock` in the implementation phase. Add
`.env` and `.env.*` to `.gitignore` while retaining `.env.example`. Remove the
committed ngrok API fallback from `src/core/config/env.js` and fail clearly when
`VITE_API_BASE_URL` is absent.

### Rationale
The verified project commands use npm and a `package-lock.json` already exists;
maintaining two lockfiles would make dependency resolution nondeterministic. The
current `.gitignore` does not exclude `.env`, and the centralized config contains a
production-like endpoint fallback, both conflicting with the constitution's secret
and production-endpoint rules.

### Alternatives considered
- Keep both npm and Yarn lockfiles: rejected because the first package installation
  would leave the other lockfile stale.
- Keep the ngrok fallback for convenience: rejected because builds could silently
  target a committed external endpoint.
- Commit the active `.env`: rejected because environment-specific configuration must
  not be versioned.

## Resolved unknowns and dependencies

- The frontend is plain JavaScript, not TypeScript.
- Vuex 4, not Pinia, is the required state layer.
- npm and `package-lock.json` are the authoritative dependency workflow.
- There is no current currency formatter or financial domain code.
- There is no current automated test harness; this feature must establish one.
- Environment safety remediation is a prerequisite for constitution compliance.
- Backend delivery remains an external dependency. It must provide the endpoints and
  response/error shapes in `contracts/project-finances.openapi.yaml`, including
  project currency, decimal strings, atomic allocation, and `INSUFFICIENT_FUNDS`.
