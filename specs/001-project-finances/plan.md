# Implementation Plan: Project Financial Management

**Branch**: `001-project-finances` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-project-finances/spec.md`

## Summary

Extend the existing planning module with project fund management, independent project
cost history, and task allocation entry/history. Three namespaced Vuex modules will
own independent resource state and call thin, contract-documented services through the
shared HTTP client. Financial domain helpers will preserve decimal strings, compare
minor units without floating-point arithmetic, format the project's API-provided
currency, and distinguish `INSUFFICIENT_FUNDS`. Every mutation re-synchronizes
server-authoritative state, and a Vitest harness will cover the risky domain, service,
store, and component behavior.

## Technical Context

**Language/Version**: Browser JavaScript (ES modules, plain JS + JSDoc), Vue 3.5.13

**Primary Dependencies**: Vue Router 4.5, Vuex 4.0, Axios 1.7 through the shared client,
Vite 6.0, browser `Intl.NumberFormat` and `BigInt`

**Storage**: N/A in the frontend; authoritative data is held by the Laravel API and
reactive session state is held in memory by Vuex

**Testing**: Add Vitest, `@vue/test-utils`, and `happy-dom`; retain production build and
documented end-to-end manual acceptance verification

**Package Manager**: npm with `package-lock.json`; remove the stale `yarn.lock` when
dependencies change so only one lockfile remains authoritative

**Target Platform**: Modern evergreen desktop and mobile browsers running the Vue SPA

**Project Type**: Single frontend web application consuming an external Laravel API

**Performance Goals**: Refreshed fund balances and task allocation history visible
within 3 seconds of accepted allocation under normal conditions; valid allocation
workflow completable in under 60 seconds

**Constraints**: Preserve exact decimal-string transport; no direct HTTP from views;
no optimistic financial balances; project ISO 4217 currency is authoritative; cost
dates remain date-only; recorded timestamps display locally; access tokens remain
memory-only; backend must atomically enforce available balance

**Scale/Scope**: Three protected pages, six financial components, three Vuex modules,
three services, and one domain helper file. Lists are project/task scoped and unpaged
because pagination, filtering, export, reporting, and multi-currency conversion are
outside this feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-design gate

- **Module ownership — PASS**: Funds and costs belong to projects and allocations join
  project funds to tasks, so `src/modules/planning/` owns all feature code.
- **Layering — PASS**: Pages/components read getters and dispatch actions; actions call
  resource services; services alone call `httpClient`.
- **Shared infrastructure — PASS**: Existing environment, HTTP normalization, root
  router, and root Vuex composition remain authoritative. Implementation includes the
  required removal of the committed external API fallback and protection of local
  `.env` files before finance integration.
- **Security — PASS**: Every route requires authentication; no token/cookie behavior or
  browser persistence is introduced; existing protected-endpoint `401` handling stays
  intact.
- **Contracts and domain types — PASS**: The external contract is defined in
  `contracts/project-finances.openapi.yaml`; runtime financial constants and mappings
  are centralized in `types/finances.types.js`; each service will document its subset.
- **Verification and documentation — PASS**: The plan adds a test harness and coverage
  at helper, service, store, and component levels. `ARQUITETURA.md` will document the
  new financial flow, modules, and API contracts.

### Post-design gate

- **Module ownership — PASS**: The data model and source tree introduce no finance
  business code outside `planning`.
- **Layering — PASS**: Cross-resource refresh is orchestrated by Vuex root dispatch,
  not by components or services.
- **Shared infrastructure — PASS**: Contract errors continue through `HttpError`; no
  second client, configuration path, router, or state library is introduced.
- **Environment safety — PASS WITH PLANNED REMEDIATION**: `.env` files will be ignored
  and `VITE_API_BASE_URL` will be required instead of silently using the current ngrok
  fallback. This closes an existing constitutional violation before delivery.
- **Security — PASS**: The OpenAPI dependency requires authenticated operations and
  backend project authorization; the quickstart verifies forbidden and expired
  sessions.
- **Contracts and domain types — PASS**: Money, currency, dates, identities,
  relationships, validation, ordering, and error envelopes are explicit in the design
  artifacts.
- **Verification and documentation — PASS**: Automated and manual checks map to the
  high-risk acceptance scenarios, and architecture documentation is an implementation
  deliverable.

No constitutional violations require exception tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-project-finances/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── project-finances.openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md                         # Created by /speckit-tasks
```

### Source Code (repository root)

```text
.gitignore                           # Ignore .env and .env.* except .env.example
package.json                         # Add test scripts and dev dependencies
package-lock.json                    # Authoritative dependency lockfile
yarn.lock                            # Remove stale second lockfile
vite.config.js                       # Add Vitest configuration if not split out
ARQUITETURA.md                       # Document financial modules and flows

src/
├── core/
│   ├── config/env.js                # Require configured API base URL
│   ├── router/index.js              # Already composes planning routes
│   └── store/index.js               # Register funds, costs, allocations modules
└── modules/planning/
    ├── components/
    │   ├── FundFormModal.vue
    │   ├── FundBalanceSummary.vue
    │   ├── CostRegistrationForm.vue
    │   ├── CostHistoryList.vue
    │   ├── TaskAllocationForm.vue
    │   └── AllocationHistoryList.vue
    ├── pages/
    │   ├── ProjectDetailPage.vue    # Add finance navigation/actions
    │   ├── ProjectFundsPage.vue
    │   ├── ProjectCostsPage.vue
    │   └── TaskFinancePage.vue
    ├── routes/
    │   └── planning.routes.js       # Add three protected lazy routes
    ├── services/
    │   ├── funds.service.js
    │   ├── costs.service.js
    │   └── allocations.service.js
    ├── store/
    │   ├── projects.store.js        # Existing project currency consumption
    │   ├── tasks.store.js           # Add current-task retrieval for finance page
    │   ├── funds.store.js
    │   ├── costs.store.js
    │   └── allocations.store.js
    └── types/
        ├── planning.types.js        # Extend Project typedef with currency
        └── finances.types.js

tests/
├── setup.js
├── contract/
│   ├── funds.service.spec.js
│   ├── costs.service.spec.js
│   └── allocations.service.spec.js
├── unit/
│   ├── finances.types.spec.js
│   ├── funds.store.spec.js
│   ├── costs.store.spec.js
│   └── allocations.store.spec.js
└── components/
    ├── FundFormModal.spec.js
    ├── CostRegistrationForm.spec.js
    └── TaskAllocationForm.spec.js
```

**Structure Decision**: Keep all business behavior in the existing planning feature.
Separate stores and services by financial resource so each has independent request
state, while pages compose those resources through namespaced getters/actions. The
only root changes register module-owned stores; planning routes remain composed by the
existing root router.

## Phase 0: Research outcome

[research.md](./research.md) resolves the technology and integration choices:

- Vuex modules and thin services follow existing repository conventions.
- Nested REST resources define project/task ownership.
- Decimal strings convert to `BigInt` minor units only for validation/comparison.
- Backend allocation is atomic; frontend state is refreshed, never optimistic.
- Vitest and Vue Test Utils establish the missing automated verification harness.
- npm is authoritative, and environment files/endpoints are secured before integration.

There are no remaining `NEEDS CLARIFICATION` items.

## Phase 1: Design outcome

- [data-model.md](./data-model.md) defines entities, relationships, invariants,
  lifecycle, frontend state, and validation ownership.
- [project-finances.openapi.yaml](./contracts/project-finances.openapi.yaml) defines
  endpoints, envelopes, security, decimal strings, timestamps, validation errors, and
  `INSUFFICIENT_FUNDS`.
- [quickstart.md](./quickstart.md) defines automated commands and end-to-end acceptance
  scenarios for funds, costs, allocations, concurrency, and authorization.

## Implementation strategy

1. Standardize on npm, secure `.env` handling, and remove the committed external API
   fallback so the constitution gate passes.
2. Establish Vitest configuration and test setup before financial behavior.
3. Add financial typedefs, constants, exact money validation/formatting, and date
   helpers with focused unit tests.
4. Implement and contract-test resource services against mocked `httpClient`.
5. Implement stores in dependency order: funds, costs, then allocations with
   cross-module refresh orchestration.
6. Register stores and add protected lazy routes.
7. Build fund and cost pages/components, then the task allocation/history page.
8. Add project/task navigation and current-task loading through the existing stores.
9. Verify all pending, empty, populated, success, validation, generic error,
   insufficient-funds, stale-balance, refresh-failure, and duplicate-submit states.
10. Update `ARQUITETURA.md`, run the full test suite and production build, then execute
   the quickstart acceptance scenarios against the compatible backend.
