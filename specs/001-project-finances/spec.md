# Feature Specification: Project Financial Management

**Feature Branch**: `N/A (workspace is not a Git repository)`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Add project funds, project costs, task financial allocation, and allocation histories to the existing application, with validation, feedback, refreshed balances, insufficient-funds handling, and duplicate-submission prevention."

## Clarifications

### Session 2026-07-26

- Q: How should registering a project cost affect project funds? → A: Record independently; do not change fund balances.
- Q: What backend signal must identify insufficient funds? → A: Structured error code `INSUFFICIENT_FUNDS`.
- Q: How must the API represent monetary values? → A: Base-10 decimal strings, such as `"1250.50"`.
- Q: What is the authoritative currency source for financial values? → A: The project's `currency` field returned by the API.
- Q: How must financial dates be interpreted? → A: Cost dates are date-only without timezone conversion; recorded timestamps display in the user's local timezone.
- Q: May funds in the same project have duplicate names? → A: No; names are unique per project using case-insensitive comparison.
- Q: Can financial operations use different currencies or exchange rates? → A: No; all financial operations use the project's single configured currency, and currency conversion and exchange-rate management are outside scope.
- Q: Does registering a project cost debit a fund? → A: No; only a successful task financial allocation changes a fund's available balance.
- Q: Which fund and cost management operations are included initially? → A: Creating and viewing funds and costs are included; editing or deleting them, replenishing funds, and transferring funds are outside scope.
- Q: Which ownership and authentication rules apply? → A: Existing project and task ownership rules and authentication remain in force.
- Q: How is an allocation date determined? → A: The system records it when the allocation succeeds.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Allocate Project Funds to a Task (Priority: P1)

An authorized user chooses one of the task's project funds, sees that fund's current
available balance, enters an amount, and allocates it to the task. The user receives a
clear result and can immediately see the fund's updated balances.

**Why this priority**: Allocation is the core transaction that connects project
finances to task execution and requires the strongest safeguards against invalid or
duplicated financial changes.

**Independent Test**: With a project containing one fund and one task, select the fund,
submit a valid allocation, and verify that one allocation is recorded, confirmation is
shown, and the displayed available and allocated balances are refreshed.

**Acceptance Scenarios**:

1. **Given** a fund with an available balance greater than the intended allocation,
   **When** the user selects that fund and enters a valid positive amount, **Then** the
   form displays the fund's available balance before submission and permits submission.
2. **Given** a valid allocation form, **When** the user submits it, **Then** submission
   controls remain unavailable while the request is pending and only one allocation
   request can be initiated.
3. **Given** the allocation is accepted, **When** processing completes, **Then** the
   user sees a success message, the form leaves the pending state, and the selected
   fund's total, available, and allocated balances reflect authoritative current values.
4. **Given** the backend rejects an allocation because funds are insufficient,
   **When** the rejection is received, **Then** the user sees an explicit
   insufficient-funds message, no success is implied, and the current balance is
   refreshed so the user can revise the amount.
5. **Given** the amount is blank, non-numeric, zero, negative, exceeds the displayed
   available balance, or uses unsupported currency precision, **When** the user tries
   to submit, **Then** submission is prevented and the amount field identifies the
   correction needed.

---

### User Story 2 - Create and View Project Funds (Priority: P2)

An authorized user views all funds for a project with total, available, and allocated
balances, and can create a new fund.

**Why this priority**: Users need accurate funding sources before they can make useful
task allocations.

**Independent Test**: Open a project's funds area, create a fund with a name and total
balance, and verify that the fund list presents the three required balances and a
clear operation outcome.

**Acceptance Scenarios**:

1. **Given** a project has funds, **When** the user opens its funds page, **Then** each
   fund shows its identifying name and total, available, and allocated balances.
2. **Given** the fund list is being retrieved, **When** the page is waiting, **Then** a
   loading state is visible and stale data is not presented as current.
3. **Given** valid fund details, **When** the user creates a fund, **Then** the action
   is sent once, a success message is shown, and current fund data is displayed.
4. **Given** invalid fund details or a rejected operation, **When** the user submits,
   **Then** the fund is not represented as saved and actionable validation or error
   feedback is shown.

---

### User Story 3 - Register and Review Project Costs (Priority: P3)

An authorized user records a project cost and reviews the project's cost history,
including enough detail to understand what was spent and when.

**Why this priority**: Cost tracking provides the spending record needed to understand
project finances beyond planned allocations.

**Independent Test**: Register a valid cost for a project and verify that it appears
once in the project's cost history with its amount, description, and incurred date.

**Acceptance Scenarios**:

1. **Given** valid cost details, **When** the user submits the cost, **Then** one cost
   is registered, success feedback is shown, and the refreshed history includes it.
2. **Given** a blank, non-numeric, zero, negative, or over-precision cost amount,
   **When** the user tries to submit, **Then** submission is prevented and the user is
   told how to correct the amount.
3. **Given** the cost history is loading, empty, or unavailable, **When** the user views
   the page, **Then** the page distinctly communicates the applicable loading, empty,
   or error state.
4. **Given** a cost submission is pending, **When** the user activates submission
   controls again, **Then** no duplicate cost is registered.

---

### User Story 4 - Review Task Allocation History (Priority: P4)

An authorized user reviews the financial allocation history of an individual task to
understand which project funds supplied it, how much was allocated, and when.

**Why this priority**: Historical traceability supports review and accountability after
the primary allocation workflow is available.

**Independent Test**: Open a task with multiple recorded allocations and verify that
every allocation is shown with its source fund, amount, and recorded time in a
consistent newest-first order.

**Acceptance Scenarios**:

1. **Given** a task has allocations, **When** the user opens its allocation history,
   **Then** each entry shows the source fund, allocated amount, and recorded date/time,
   ordered newest first.
2. **Given** a successful new allocation, **When** the allocation and history refresh
   complete, **Then** the new entry appears once in that task's history.
3. **Given** the history is loading, empty, or unavailable, **When** it is viewed,
   **Then** a distinct loading, empty, or error state is displayed.

### Edge Cases

- A fund becomes unavailable, is removed, or no longer belongs to the project after
  the form is opened; submission is blocked or the rejection is shown without
  presenting the allocation as successful.
- Another user allocates from the same fund after its balance is displayed; the
  backend's insufficient-funds rejection takes precedence and triggers a balance
  refresh.
- The exact available balance may be allocated, resulting in a displayed available
  balance of zero.
- A delayed or failed refresh follows an accepted allocation; success for the
  allocation remains distinguishable from the warning that current balances could
  not be reloaded.
- A project has no funds; the funds page shows an empty state and task allocation
  explains that a fund must be created before allocation.
- Repeated clicks, Enter-key presses, or other submit events while an operation is
  pending produce only one financial transaction.
- Monetary values are displayed consistently in the project's currency, including
  zero values and large balances.
- The user loses authorization while viewing or submitting financial information;
  protected data is not exposed and the existing session-handling behavior applies.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a project funds page that shows every project
  fund's name, total balance, available balance, and allocated balance.
- **FR-002**: The system MUST provide authorized users with a form to create project
  funds.
- **FR-003**: A fund creation form MUST require a name and a valid positive total
  balance, and MUST reject a name already used by another fund in the same project
  using case-insensitive comparison.
- **FR-004**: The initial feature MUST NOT provide operations to edit, delete,
  replenish, or transfer project funds.
- **FR-005**: The system MUST provide a project costs page containing cost registration
  and cost history.
- **FR-006**: Cost registration MUST capture a positive monetary amount, a description,
  and an incurred date.
- **FR-007**: Cost history MUST show each cost's amount, description, and incurred date
  in newest-first order without applying timezone conversion to the incurred date.
- **FR-008**: The system MUST provide a task financial allocation form requiring the
  user to select a fund belonging to the task's project and enter an amount.
- **FR-009**: The allocation form MUST display the currently known available balance
  for the selected fund before submission.
- **FR-010**: Financial amount forms MUST reject blank, non-numeric, zero, negative,
  and unsupported-precision values before submission.
- **FR-011**: The allocation form MUST prevent submission when the entered amount
  exceeds the displayed available balance, while still treating server-confirmed data
  as authoritative.
- **FR-012**: Every data retrieval and financial mutation MUST provide a visible,
  context-appropriate loading or pending state.
- **FR-013**: Every fund creation, cost registration, and allocation action MUST show
  a clear success result when accepted and an actionable error result when rejected.
- **FR-014**: An allocation rejection carrying the machine-readable error code
  `INSUFFICIENT_FUNDS` MUST be distinguished from generic errors and explicitly tell
  the user that the selected fund lacks enough available balance.
- **FR-015**: Following a successful task allocation, the system MUST retrieve and
  display authoritative current balances for affected project funds.
- **FR-016**: Following a successful task allocation, the system MUST refresh the
  affected task's allocation history.
- **FR-017**: The system MUST prevent multiple requests from the same form submission
  while its first request is pending.
- **FR-018**: The system MUST provide allocation history for each task, showing source
  fund, amount, and recorded date/time in the user's local timezone for every
  allocation in newest-first order.
- **FR-019**: Funds, costs, and allocation histories MUST each distinguish loading,
  empty, populated, and error states.
- **FR-020**: Monetary amounts MUST be displayed consistently using the project's
  API-provided `currency` value and its accepted precision.
- **FR-021**: Financial pages and actions MUST honor the application's existing
  authentication and authorization rules.
- **FR-022**: Failed operations MUST preserve the user's valid form input where doing
  so allows correction or retry without creating ambiguity about whether the operation
  succeeded.
- **FR-023**: Server-confirmed balances, costs, and allocations MUST be treated as the
  authoritative state after every mutation.
- **FR-024**: Registering a project cost MUST NOT change any project fund balance or
  require the user to select a fund.
- **FR-025**: API request and response payloads MUST represent monetary values as
  base-10 decimal strings using the project's currency precision.
- **FR-026**: Funds, costs, and allocations MUST use the owning project's
  API-provided `currency`; individual funds MUST NOT define or select a different
  currency.
- **FR-027**: Incurred cost dates MUST be handled as date-only values without timezone
  conversion; server-provided recorded timestamps MUST be displayed in the user's
  local timezone.
- **FR-028**: Each fund MUST have a stable backend identifier and a name unique within
  its project using case-insensitive comparison.
- **FR-029**: Only a successfully recorded task allocation MUST reduce the selected
  fund's available balance.
- **FR-030**: The system MUST record the allocation date and time when the allocation
  succeeds; users MUST NOT provide or alter that timestamp.
- **FR-031**: The initial feature MUST NOT provide operations to edit or delete
  project costs.

### Architecture and Integration Impact *(mandatory)*

- **Owning Module**: The existing `planning` module owns this capability because funds
  and costs belong to projects and allocations directly connect projects and tasks.
- **Affected Layers**: Project and task pages/components, namespaced shared state,
  feature services, the shared HTTP transport, routing, domain contracts, and
  verification coverage are affected. Dependency flow must remain
  page/component → store → service → shared client.
- **API Contract Impact**: The frontend depends on backend operations to list and
  create project funds; list and register project costs; create task allocations;
  and list task allocation history. Contracts must represent monetary values as
  base-10 decimal strings (for example, `"1250.50"`) and define response envelopes,
  authorization failures, validation failures, and a recognizable insufficient-funds
  error using the stable machine-readable code `INSUFFICIENT_FUNDS`.
- **Security Impact**: Financial data and mutations are sensitive and must use existing
  authenticated sessions and backend authorization. This feature does not alter token
  or cookie handling and must not persist access credentials or protected financial
  responses outside existing application state policies.
- **Domain Mapping Impact**: New centralized financial domain definitions are needed
  for monetary values, project funds, costs, task allocations, and the
  insufficient-funds error. Existing project and task identifiers remain the source
  for relationships.

### Key Entities *(include if feature involves data)*

- **Project Fund**: A source of project money with a stable identifier, a name unique
  within its project using case-insensitive comparison, total balance, allocated
  balance, and available balance; it uses the owning project's currency.
- **Project Cost**: A recorded project expense with an amount, description, date-only
  incurred date, recorded timestamp, and project relationship.
- **Task Allocation**: A financial assignment from one project fund to one task, with
  an amount and system-recorded time captured when the allocation succeeds; it
  contributes to the fund's allocated balance.
- **Project**: The owner of funds and costs, the source of the authoritative
  `currency` value, and the boundary within which funds may be selected for its tasks.
- **Task**: A unit of project work that receives allocations and exposes its allocation
  history.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of project funds display total, available,
  and allocated balances without requiring users to calculate any value.
- **SC-002**: At least 90% of representative users can create a fund, register a cost,
  and allocate funds to a task on their first attempt without assistance.
- **SC-003**: Users can complete a valid task allocation in under 60 seconds when funds
  and tasks already exist.
- **SC-004**: Invalid, non-positive, over-precision, and visibly over-balance amounts
  result in zero submitted financial transactions in 100% of validation tests.
- **SC-005**: Repeated submission attempts while a request is pending create exactly
  one financial record in 100% of concurrency and interaction tests.
- **SC-006**: After every accepted allocation, users see refreshed authoritative fund
  balances and the new task history entry within 3 seconds under normal operating
  conditions.
- **SC-007**: In 100% of simulated insufficient-funds rejections, users receive a
  specific insufficient-funds explanation rather than a generic failure message.
- **SC-008**: All tested funds, costs, and allocation histories provide distinguishable
  loading, empty, populated, success where applicable, and error feedback.

## Assumptions

- Existing authenticated users who can manage a project are authorized to view and
  modify its financial information; the backend remains the authority for permissions.
- Each project has one API-provided `currency`, and all of its fund, cost, and
  allocation amounts use that currency and its standard minor-unit precision.
- A fund's available balance equals its total balance minus its server-recognized
  allocations; balances are calculated and enforced by the backend.
- Project costs are recorded independently from task allocations.
- Fund, cost, and allocation histories are read-only in this feature. Editing or
  deleting funds or costs, replenishing or transferring funds, and editing, deleting,
  or reversing allocations are outside scope.
- Existing project and task ownership rules and authentication remain unchanged.
- Allocation timestamps are generated by the system when an allocation succeeds.
- Pagination, filtering, exporting, multi-currency conversion, and financial reporting
  are outside scope for this feature.
- Existing application conventions for navigation, feedback presentation, formatting,
  state management, transport, and visual design will be reused.
- Required backend financial operations and structured validation/error responses
  either exist or will be delivered as dependencies before frontend integration can be
  completed.
