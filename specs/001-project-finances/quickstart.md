# Quickstart: Validate Project Financial Management

## Prerequisites

- Node.js version supported by Vite 6.
- npm and `package-lock.json` used as the sole dependency workflow.
- Frontend dependencies installed with `npm install`.
- Laravel API explicitly configured through `VITE_API_BASE_URL`; there is no committed
  external endpoint fallback.
- An authenticated user authorized to manage a test project.
- Backend implementation compatible with
  `contracts/project-finances.openapi.yaml`.
- Test data containing one project with:
  - an API-provided ISO 4217 `currency`;
  - at least one task;
  - one fund with an available balance greater than zero.

## Start the application

```bash
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5174`) and sign in. The existing
bootstrap must restore the session before protected routes render.

## Automated verification

After implementation adds the planned Vitest harness:

```bash
npm test
npm run build
```

Expected:

- all money-helper, service-contract, store, and component tests pass;
- the production bundle builds without errors;
- no financial page or component imports Axios or `httpClient`;
- no access token or protected financial response is written to browser storage.

## Scenario 1: Create and update a fund

1. Open a project and follow the **Funds** action.
2. Confirm a visible loading state precedes the fund list.
3. Create `General Fund` with a valid positive amount.
4. Confirm success feedback and refreshed total, allocated, and available balances.
5. Attempt to create `general fund`; confirm case-insensitive duplicate validation.
6. Allocate part of the fund using Scenario 3, then attempt to reduce its total below
   the allocated balance; confirm the update is rejected and input remains editable.

Expected:

- currency formatting uses `project.currency`;
- all three balances come from the refreshed backend response;
- repeated submission while pending sends one request.

## Scenario 2: Register a project cost

1. Open the project's **Costs** page.
2. Submit a positive amount, description, and incurred date.
3. Confirm one cost appears in the refreshed newest-first history.
4. Confirm the incurred calendar date is unchanged by timezone.
5. Compare fund balances before and after cost registration.

Expected:

- the cost appears once with localized money;
- fund balances do not change;
- blank, zero, negative, non-numeric, and over-precision amounts do not submit;
- loading, empty, populated, and error states are distinguishable.

## Scenario 3: Allocate funds to a task

1. From the project task list, open a task's **Finance** action.
2. Select a project fund and confirm its current available balance is shown.
3. Enter an amount equal to or below that balance and submit repeatedly while the
   request is pending.
4. Confirm exactly one request and one history record.
5. Confirm fund balances and allocation history refresh after success.

Expected:

- the successful amount is reflected in authoritative allocated/available balances;
- the history displays fund name, amount, and the server timestamp in local time;
- the complete flow is usable in under 60 seconds with existing project data.

## Scenario 4: Insufficient funds and concurrency

1. Open the same fund in two authenticated browser sessions.
2. Allocate from the first session so that the second session's displayed balance is
   stale.
3. Submit the now-excessive amount in the second session.

Expected:

- the backend returns `code: "INSUFFICIENT_FUNDS"`;
- no second allocation is created;
- the second session shows a specific insufficient-funds message;
- funds refresh to the authoritative balance while the entered amount remains
  available for correction;
- a refresh failure is shown separately from the rejected allocation.

## Scenario 5: Authorization and session expiry

1. Request each financial route as a user without project access.
2. Expire the authenticated session and retry a financial retrieval or mutation.

Expected:

- the backend remains the authority for project access;
- forbidden financial data is not rendered;
- a protected `401` clears in-memory authentication through the shared interceptor;
- the application follows the existing login redirect behavior;
- no financial implementation changes auth cookie or token handling.

## Contract inspection

Verify service payloads and responses against:

- `contracts/project-finances.openapi.yaml`
- `data-model.md`

Any backend deviation in endpoint, envelope, money representation, error code,
timestamp offset, or project currency must be resolved before frontend integration is
considered complete.

## Latest validation status

- `npm test`: 19 files and 102 tests passing.
- `npm run build`: passing with the pre-existing large `elk.bundled` chunk warning.
- Live Scenarios 1–5 remain pending because this workspace session has no supplied
  authenticated backend test account and seeded project/fund/task data. Do not mark
  backend integration complete until those prerequisites are available.
