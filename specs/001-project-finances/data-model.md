# Data Model: Project Financial Management

## Conventions

- Identifiers are stable backend identifiers and are treated as opaque numbers by the
  frontend.
- Monetary values cross the API boundary as base-10 decimal strings.
- Every financial entity uses the owning project's ISO 4217 `currency`.
- `incurred_on` is a date-only `YYYY-MM-DD` value.
- `recorded_at` is an ISO 8601 timestamp containing `Z` or an explicit offset.
- Lists are returned newest first where the contract defines a history.

## Project extension

Existing project fields remain unchanged.

| Field | Type | Required | Rules |
|---|---|---:|---|
| `id` | number | yes | Stable backend identifier |
| `name` | string | yes | Existing project name |
| `currency` | string | yes | Three-letter uppercase ISO 4217 code; authoritative for all project financial values |

Relationships:

- One project has zero or more funds.
- One project has zero or more costs.
- One project has zero or more tasks.

## Project Fund

| Field | Type | Required | Rules |
|---|---|---:|---|
| `id` | number | yes | Stable backend identifier |
| `project_id` | number | yes | Must reference the route project |
| `name` | string | yes | Trimmed; unique within project using case-insensitive comparison |
| `total_balance` | decimal string | yes | Positive; project currency precision |
| `allocated_balance` | decimal string | yes | Non-negative; server-calculated |
| `available_balance` | decimal string | yes | `total_balance - allocated_balance`; server-calculated |
| `created_at` | ISO timestamp | no | Backend audit value |
| `updated_at` | ISO timestamp | no | Backend audit value |

Validation:

- The creation command accepts `project_id`, `name`, and `opening_balance`.
- `opening_balance` is a positive decimal string in the project's currency.
- Editing and replenishing an existing fund are outside this feature.
- The frontend provides early validation, but the backend enforces every invariant.

Lifecycle:

1. Created with no allocation balance.
2. The opening balance becomes the fund's initial `total_balance` and
   `available_balance`.
3. Allocation atomically increases `allocated_balance` and decreases
   `available_balance`.
4. Editing, replenishing, transferring, and deleting are outside this feature.

## Project Cost

| Field | Type | Required | Rules |
|---|---|---:|---|
| `id` | number | yes | Stable backend identifier |
| `project_id` | number | yes | Must reference the route project |
| `amount` | decimal string | yes | Positive; project currency precision |
| `description` | string | yes | Trimmed, non-empty |
| `incurred_on` | date string | yes | `YYYY-MM-DD`; no timezone conversion |
| `recorded_at` | ISO timestamp | yes | Backend-generated audit timestamp |

Relationships and invariants:

- Each cost belongs to exactly one project.
- A cost has no fund relationship.
- Registering a cost does not alter any fund balance.
- Editing, deleting, and reversing costs are outside this feature.

Lifecycle:

1. Registered once.
2. Returned in project cost history ordered by `incurred_on` descending and then
   `recorded_at` descending for deterministic ties.
3. Remains read-only in this feature.

## Task Allocation

| Field | Type | Required | Rules |
|---|---|---:|---|
| `id` | number | yes | Stable backend identifier |
| `task_id` | number | yes | Receiving task |
| `fund_id` | number | yes | Fund from the same project as the task |
| `fund_name` | string | yes | Historical display label returned by backend |
| `amount` | decimal string | yes | Positive; project currency precision |
| `actor_user_id` | number | yes | Authenticated user; supplied by backend session context |
| `recorded_at` | ISO timestamp | yes | Backend-generated; displayed in user's local timezone |

Relationships and invariants:

- Each allocation belongs to exactly one task and one project fund.
- The task and fund must belong to the same project.
- The allocation amount may equal but cannot exceed the authoritative available
  balance.
- Creation and balance mutation are one atomic backend operation.
- Editing, deleting, reversing, and transferring allocations are outside this feature.

Lifecycle:

1. User selects a current project fund and enters an amount.
2. Frontend validates the canonical decimal string against the displayed balance.
3. Backend atomically validates and records the allocation.
4. On success, the frontend refetches project funds and the task allocation history.
5. On `INSUFFICIENT_FUNDS`, no allocation is created and funds are refetched.

## Frontend state model

### `funds` Vuex module

- `itemsByProject`: project identifier to fund array.
- `loadingByProject`: project identifier to retrieval state.
- `errorByProject`: project identifier to normalized error message.
- `saving`: one create/update request descriptor or `null`.
- Getters expose project-scoped items, loading/error/empty state, and fund lookup.

### `costs` Vuex module

- `itemsByProject`: project identifier to newest-first cost array.
- `loadingByProject`: project identifier to retrieval state.
- `errorByProject`: project identifier to normalized error message.
- `registering`: true only while cost registration is pending.

### `allocations` Vuex module

- `itemsByTask`: task identifier to newest-first allocation array.
- `loadingByTask`: task identifier to retrieval state.
- `errorByTask`: task identifier to normalized error message.
- `allocating`: true only while allocation submission is pending.
- `allocationErrorCode`: machine-readable code for specialized feedback.

All mutations are synchronous. Actions own asynchronous service calls and refresh
orchestration. Failed writes preserve component form values for correction.

## Validation helpers

`src/modules/planning/types/finances.types.js` will be the single source for:

- currency fraction-digit lookup;
- canonical decimal normalization;
- safe decimal-string-to-minor-unit conversion;
- positive, precision, and available-balance validation;
- localized money formatting;
- date-only and local timestamp formatting;
- the `INSUFFICIENT_FUNDS` code and error predicate.
