# Tasks: Project Financial Management

**Input**: Design documents from `/specs/001-project-finances/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/project-finances.openapi.yaml`, `quickstart.md`

**Verification**: Automated coverage is required by the project constitution. Tests
should be written and observed failing before their corresponding implementation task.

**Organization**: Tasks are grouped by user story so each story can be implemented and
validated as an increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency
  on an incomplete task.
- **[Story]**: Maps a task to a user story from `spec.md`.
- Every task names the exact file or files it changes.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a deterministic, secure dependency and test environment before
financial code is introduced.

- [X] T001 Standardize on npm by adding `test` and `test:watch` scripts plus Vitest, `@vue/test-utils`, and `happy-dom` dev dependencies in `package.json`, updating `package-lock.json`, and removing `yarn.lock`
- [X] T002 Configure the shared Vitest `happy-dom` environment, Vue plugin, `@` alias, coverage exclusions, and setup loading in `vite.config.js` and create `tests/setup.js`
- [X] T003 Add failing tests for required `VITE_API_BASE_URL`, numeric timeout fallback, and explicit configured values in `tests/unit/env.spec.js`
- [X] T004 Ignore `.env` and `.env.*` while retaining `.env.example` in `.gitignore`, then remove the committed external API fallback and add clear missing-URL failure behavior in `src/core/config/env.js` until `tests/unit/env.spec.js` passes

**Checkpoint**: npm is authoritative, local environment files are protected, runtime
API configuration is explicit, and `npm test` can execute Vue and JavaScript tests.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Provide shared financial contracts and exact money/date/error behavior
used by every story.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T005 Create reusable mocked shared-client response/error helpers for service contract tests in `tests/helpers/httpClient.mock.js`
- [X] T006 [P] Add failing coverage for currency precision, canonical decimal normalization, `BigInt` minor-unit comparison, positive/over-balance validation, localized money display, date-only display, local timestamp display, and `INSUFFICIENT_FUNDS` recognition in `tests/unit/finances.types.spec.js`
- [X] T007 Implement Project Fund, Project Cost, and Task Allocation JSDoc contracts plus all tested money/date/error helpers in `src/modules/planning/types/finances.types.js`
- [X] T008 Extend the Project JSDoc contract with its required ISO 4217 `currency` field in `src/modules/planning/types/planning.types.js`

**Checkpoint**: Financial values can be validated and displayed without floating-point
arithmetic, and all stories share one canonical domain contract.

---

## Phase 3: User Story 1 — Allocate Project Funds to a Task (Priority: P1) 🎯 MVP

**Goal**: Let an authorized user select a project fund, see its available balance,
submit exactly one valid task allocation, receive specific insufficient-funds
feedback, and see authoritative balances refreshed.

**Independent Test**: With one project, one task, and one existing fund, submit a valid
allocation and verify one request/record, success feedback, and refreshed balances;
then simulate stale balance and verify `INSUFFICIENT_FUNDS`, preserved input, and a
fund refresh.

### Verification for User Story 1

- [X] T009 [P] [US1] Add failing contract tests for `GET /projects/{projectId}/funds` envelope unwrapping and decimal-string preservation in `tests/contract/funds.service.spec.js`
- [X] T010 [P] [US1] Add failing contract tests for `POST /tasks/{taskId}/financial-allocations`, snake_case payloads, and raw `INSUFFICIENT_FUNDS` propagation in `tests/contract/allocations.service.spec.js`
- [X] T011 [P] [US1] Add failing read-state tests for project-keyed fund loading, populated, empty, and error behavior in `tests/unit/funds.store.spec.js`
- [X] T012 [P] [US1] Add failing allocation-action tests for pending guards, one service call, successful fund/history refetch, insufficient-funds fund refetch, generic errors, and refresh-failure separation in `tests/unit/allocations.store.spec.js`
- [X] T013 [P] [US1] Add failing current-task retrieval tests using the existing task service in `tests/unit/tasks.store.finance.spec.js`
- [X] T014 [P] [US1] Add failing component tests for fund selection, available-balance display, exact-balance allocation, invalid amounts, disabled repeated submission, preserved retry input, and specific insufficient-funds feedback in `tests/components/TaskAllocationForm.spec.js`
- [X] T015 [P] [US1] Add failing page tests for project/task loading, no-funds guidance, success feedback, generic failures, and finance-route parameter handling in `tests/components/TaskFinancePage.spec.js`

### Implementation for User Story 1

- [X] T016 [P] [US1] Implement contract-documented project fund listing and Laravel envelope normalization in `src/modules/planning/services/funds.service.js`
- [X] T017 [P] [US1] Implement contract-documented task allocation listing/creation with canonical decimal-string payloads in `src/modules/planning/services/allocations.service.js`
- [X] T018 [US1] Implement project-keyed fund retrieval state, getters, synchronous mutations, and `fetchFunds` action in `src/modules/planning/store/funds.store.js`
- [X] T019 [P] [US1] Add `currentTask`, `taskById`, and `fetchTask` flow through the existing task service in `src/modules/planning/store/tasks.store.js`
- [X] T020 [US1] Implement task-keyed allocation state and guarded `allocate` action with success/insufficient-funds refresh orchestration via root dispatch in `src/modules/planning/store/allocations.store.js`
- [X] T021 [US1] Register the new `funds` and `allocations` namespaced modules in `src/core/store/index.js`
- [X] T022 [P] [US1] Implement reusable total, allocated, and available currency display in `src/modules/planning/components/FundBalanceSummary.vue`
- [X] T023 [P] [US1] Implement allocation form validation, selected-fund balance display, pending controls, server validation mapping, retry preservation, and specialized error feedback in `src/modules/planning/components/TaskAllocationForm.vue`
- [X] T024 [US1] Compose project, task, fund retrieval, allocation submission, success/warning feedback, and refresh states in `src/modules/planning/pages/TaskFinancePage.vue`
- [X] T025 [US1] Add the protected lazy `/projects/:projectId/tasks/:taskId/finance` route in `src/modules/planning/routes/planning.routes.js` and add a Finance action for each task in `src/modules/planning/pages/ProjectDetailPage.vue`

**Checkpoint**: User Story 1 is independently functional and constitutes the MVP.

---

## Phase 4: User Story 2 — View and Manage Project Funds (Priority: P2)

**Goal**: Let an authorized user view all project balances and create or update funds
with case-insensitive name uniqueness and allocated-balance safeguards.

**Independent Test**: Open a project funds page, create a uniquely named positive fund,
update its name/total, and verify refreshed total, allocated, and available balances;
confirm duplicate names and totals below allocated balance do not submit.

### Verification for User Story 2

- [X] T026 [P] [US2] Extend `tests/contract/funds.service.spec.js` with failing POST/PUT endpoint, payload, envelope, validation-error, and decimal-string contract cases
- [X] T027 [P] [US2] Extend `tests/unit/funds.store.spec.js` with failing guarded create/update, authoritative refetch, pending reset, and normalized failure cases
- [X] T028 [P] [US2] Add failing create/edit form tests for case-insensitive duplicate names, positive currency precision, total not below allocated, server field errors, one pending request, and preserved input in `tests/components/FundFormModal.spec.js`
- [X] T029 [P] [US2] Add failing funds-page tests for loading, empty, populated, success, error, create/edit modal, and project currency states in `tests/components/ProjectFundsPage.spec.js`

### Implementation for User Story 2

- [X] T030 [US2] Add create/update transport methods, exact payload coercion, and documented response/error contracts in `src/modules/planning/services/funds.service.js`
- [X] T031 [US2] Add guarded `createFund` and `updateFund` actions with authoritative project-fund refetch in `src/modules/planning/store/funds.store.js`
- [X] T032 [P] [US2] Implement create/edit form state, client/server validation, duplicate-submit prevention, and retry-safe feedback in `src/modules/planning/components/FundFormModal.vue`
- [X] T033 [US2] Implement project loading, fund state rendering, `FundBalanceSummary` composition, and create/edit workflow in `src/modules/planning/pages/ProjectFundsPage.vue`
- [X] T034 [US2] Add the protected lazy `/projects/:projectId/funds` route in `src/modules/planning/routes/planning.routes.js` and a Funds action in `src/modules/planning/pages/ProjectDetailPage.vue`

**Checkpoint**: User Stories 1 and 2 work independently against existing project/task
data and preserve server-authoritative balances.

---

## Phase 5: User Story 3 — Register and Review Project Costs (Priority: P3)

**Goal**: Let an authorized user register an independent project cost and review
newest-first cost history without changing fund balances.

**Independent Test**: Register one valid cost and verify it appears once with amount,
description, and unchanged incurred date while fund balances remain unchanged; verify
invalid and repeated submissions create no record.

### Verification for User Story 3

- [X] T035 [P] [US3] Add failing contract tests for `GET|POST /projects/{projectId}/costs`, snake_case date-only/decimal payloads, envelope unwrapping, and validation errors in `tests/contract/costs.service.spec.js`
- [X] T036 [P] [US3] Add failing project-keyed cost store tests for loading/empty/error states, one guarded registration, authoritative history refetch, and no fund dispatch in `tests/unit/costs.store.spec.js`
- [X] T037 [P] [US3] Add failing form tests for positive precision, required description/date, date-only preservation, server field errors, pending controls, and retry input in `tests/components/CostRegistrationForm.spec.js`
- [X] T038 [P] [US3] Add failing history-list tests for amount formatting, date-only display, deterministic backend order, and empty state in `tests/components/CostHistoryList.spec.js`
- [X] T039 [P] [US3] Add failing costs-page tests for loading, empty, populated, success, registration failure, and unavailable-history states in `tests/components/ProjectCostsPage.spec.js`

### Implementation for User Story 3

- [X] T040 [P] [US3] Implement contract-documented project cost listing/creation, exact decimal strings, date-only payloads, and envelope normalization in `src/modules/planning/services/costs.service.js`
- [X] T041 [US3] Implement project-keyed newest-first cost state, getters, synchronous mutations, guarded registration, and authoritative history refetch in `src/modules/planning/store/costs.store.js`
- [X] T042 [US3] Register the `costs` namespaced module without changing existing auth/state behavior in `src/core/store/index.js`
- [X] T043 [P] [US3] Implement cost form state, domain/server validation, pending prevention, retry preservation, and success emission in `src/modules/planning/components/CostRegistrationForm.vue`
- [X] T044 [P] [US3] Implement read-only localized amount and date-only cost history states in `src/modules/planning/components/CostHistoryList.vue`
- [X] T045 [US3] Compose project currency, cost registration, authoritative history, and distinct loading/empty/populated/error feedback in `src/modules/planning/pages/ProjectCostsPage.vue`
- [X] T046 [US3] Add the protected lazy `/projects/:projectId/costs` route in `src/modules/planning/routes/planning.routes.js` and a Costs action in `src/modules/planning/pages/ProjectDetailPage.vue`

**Checkpoint**: User Story 3 works independently and cost registration has no fund
selection, fund mutation, or balance refresh side effect.

---

## Phase 6: User Story 4 — Review Task Allocation History (Priority: P4)

**Goal**: Show every task allocation with source fund, localized amount, and local
recorded time in backend-provided newest-first order.

**Independent Test**: Open a task with multiple allocations and verify all entries are
shown once in newest-first order with fund name, amount, and local date/time; verify
loading, empty, and unavailable states.

### Verification for User Story 4

- [X] T047 [P] [US4] Add failing history component tests for source fund, localized amount, local timestamp, newest-first preservation, loading, empty, and error states in `tests/components/AllocationHistoryList.spec.js`
- [X] T048 [P] [US4] Extend `tests/components/TaskFinancePage.spec.js` with failing initial-history retrieval, post-allocation refresh display, duplicate-entry prevention, and refresh-warning cases

### Implementation for User Story 4

- [X] T049 [P] [US4] Implement read-only task allocation history rendering and all retrieval states in `src/modules/planning/components/AllocationHistoryList.vue`
- [ ] T050 [US4] Add a backend allocation-history listing route, then integrate authoritative initial history loading in `src/modules/planning/pages/TaskFinancePage.vue`

**Checkpoint**: All four user stories are functional and independently verifiable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Enforce security/layer boundaries, synchronize architecture documentation,
and validate the complete feature.

- [X] T051 [P] Add automated assertions that every financial route is lazy and requires authentication in `tests/unit/planning.routes.finance.spec.js`
- [X] T052 [P] Add an architecture-boundary test rejecting Axios/`httpClient` imports from financial pages/components and browser-storage use for financial/auth data in `tests/unit/architecture-boundaries.spec.js`
- [X] T053 Update module/store/route inventories, financial API contracts, exact money/date rules, and allocation refresh/error flow in `ARQUITETURA.md`
- [X] T054 Run `npm test` and `npm run build`, fix only feature-introduced failures in the files listed by `specs/001-project-finances/plan.md`, and record any environment-only limitation in `specs/001-project-finances/quickstart.md`
- [ ] T055 Execute every automated/manual scenario in `specs/001-project-finances/quickstart.md` against a compatible Laravel API and record deviations from `specs/001-project-finances/contracts/project-finances.openapi.yaml` before completion

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 — Setup**: Starts immediately.
- **Phase 2 — Foundational**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 — US1**: Depends on Phase 2 and delivers the MVP.
- **Phase 4 — US2**: Depends on Phase 2; when executed concurrently with US1,
  coordinate ownership of `funds.service.js` and `funds.store.js`. The numbered
  sequence assumes US1 lands first.
- **Phase 5 — US3**: Depends only on Phase 2 and can run in parallel with US1/US2.
- **Phase 6 — US4**: Depends on US1 allocation service/store and task-finance page.
- **Phase 7 — Polish**: Depends on every story selected for delivery.

### User story dependency graph

```text
Setup → Foundation ─┬→ US1 (MVP) ─→ US4
                    ├→ US2
                    └→ US3
```

US2 and US3 are independently testable. US2 shares the fund transport/state files
introduced for US1, while US4 intentionally extends US1's allocation flow.

### Within each user story

1. Write and run the story's automated tests; confirm they fail for the missing
   behavior.
2. Implement domain/service transport before Vuex orchestration.
3. Implement Vuex actions/mutations before pages and components depend on them.
4. Register modules/routes only after their imported files exist.
5. Run the story-specific tests and its independent acceptance scenario.
6. Do not proceed past the checkpoint while the story regresses an earlier phase.

### Parallel opportunities

- T005, T006, and T008 can be split after the sequential test-harness setup.
- US1 contract, store, task-store, and component test files T009–T015 can be authored
  concurrently; services T016/T017 and components T022/T023 are separate-file work.
- US2 tests T026–T029 can be authored concurrently; T032 can proceed after its tests
  while transport/state work T030/T031 is completed.
- Every US3 test T035–T039 is a separate file; T040, T043, and T044 are parallel
  implementation paths after their tests exist.
- US4 tests T047/T048 and component T049 are separate-file work.
- T051–T053 can run concurrently after all story files stabilize.

## Parallel execution examples

### User Story 1

```text
Task T009: Contract-test fund listing in tests/contract/funds.service.spec.js
Task T010: Contract-test allocation transport in tests/contract/allocations.service.spec.js
Task T013: Test task retrieval in tests/unit/tasks.store.finance.spec.js
Task T014: Test allocation UI in tests/components/TaskAllocationForm.spec.js
```

### User Story 2

```text
Task T026: Extend fund contract tests in tests/contract/funds.service.spec.js
Task T027: Extend fund store tests in tests/unit/funds.store.spec.js
Task T028: Test fund form in tests/components/FundFormModal.spec.js
Task T029: Test funds page in tests/components/ProjectFundsPage.spec.js
```

### User Story 3

```text
Task T035: Test cost API contract in tests/contract/costs.service.spec.js
Task T036: Test cost Vuex flow in tests/unit/costs.store.spec.js
Task T037: Test cost form in tests/components/CostRegistrationForm.spec.js
Task T038: Test cost history in tests/components/CostHistoryList.spec.js
Task T039: Test costs page in tests/components/ProjectCostsPage.spec.js
```

### User Story 4

```text
Task T047: Test allocation history in tests/components/AllocationHistoryList.spec.js
Task T048: Test task-finance history integration in tests/components/TaskFinancePage.spec.js
```

## Implementation Strategy

### MVP first

1. Complete Setup and Foundational phases.
2. Complete User Story 1 through T025.
3. Stop and run US1 contract, store, and component tests.
4. Execute Quickstart Scenarios 3 and 4.
5. Demo/deploy the allocation MVP only if backend contract and security checks pass.

### Incremental delivery

1. **US1**: Task allocation with authoritative balance refresh and stale-balance error.
2. **US2**: Fund creation/update and complete balance management.
3. **US3**: Independent cost registration/history.
4. **US4**: Allocation traceability UI.
5. **Polish**: Architecture/security gates and full quickstart.

### Parallel team strategy

- Complete Setup/Foundation together.
- Assign US1 and US3 to separate developers.
- Start US2 after coordinating ownership of the fund service/store with US1.
- Start US4 after the US1 allocation flow exists.
- Merge through story checkpoints so each increment remains demonstrable.

## Notes

- `[P]` means separate-file work with no incomplete prerequisite.
- Tests precede implementation because financial precision, concurrency, and error
  discrimination are high-risk behavior.
- Services document endpoint, payload, query, envelope, and failure assumptions beside
  their implementation.
- Components never import Axios or `httpClient`; they use Vuex getters/actions.
- Backend authorization and atomic allocation checks remain authoritative.
- Commit creation is outside this task list unless explicitly requested.
