<!--
Sync Impact Report
- Version change: template (unversioned) → 1.0.0
- Modified principles:
  - Template Principle 1 → I. Feature-First Modular Design
  - Template Principle 2 → II. Strict Layer Boundaries
  - Template Principle 3 → III. Centralized Core Infrastructure
  - Template Principle 4 → IV. Secure Session Handling
  - Template Principle 5 → V. Explicit Domain Contracts and Verification
- Added sections:
  - Architecture and Technology Constraints
  - Development Workflow and Quality Gates
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Runtime guidance reviewed:
  - ✅ ARQUITETURA.md
  - ✅ README.md
- Follow-up TODOs: none
-->
# Northloom Frontend Constitution

## Core Principles

### I. Feature-First Modular Design

Business capabilities MUST be organized under `src/modules/<feature>/`, with their
pages, components, routes, services, stores, and domain types kept together. Projects,
tasks, scheduling, and Telegram notifications MUST have explicit domain ownership.
The existing `planning` module MAY own the tightly coupled projects, tasks, and
calendar capabilities; unrelated notification behavior MUST remain independently
replaceable. New features MUST be added by composing a module into the root router
and store, not by placing business rules in `core/`.

Rationale: Feature ownership keeps changes cohesive, prevents horizontal folders from
becoming shared dumping grounds, and allows capabilities to evolve independently.

### II. Strict Layer Boundaries

Every feature MUST preserve the dependency flow `page/component → Vuex store →
service → shared HTTP client → Laravel API`. Views MUST read shared state through
getters and change it through dispatched actions. Views MUST NOT call Axios or the
HTTP client directly. Services MUST remain thin transport adapters and MUST NOT
contain UI or reactive-state logic. Asynchronous work belongs in actions; mutations
MUST remain synchronous.

Rationale: One-way dependencies make state changes predictable and stop transport,
presentation, and business concerns from leaking across layers.

### III. Centralized Core Infrastructure

Cross-cutting infrastructure MUST live in `src/core/` and MUST be reusable without
feature-specific business rules. All API traffic MUST use the single configured HTTP
client. Environment values MUST be exposed through `src/core/config/env.js`; modules
MUST NOT read `import.meta.env` directly. Root routing and state registration MUST
compose module-provided routes and namespaced Vuex stores. Pages reachable by route
SHOULD be lazy-loaded unless an explicit performance measurement justifies eager
loading.

Rationale: A small, stable core gives every module consistent configuration,
authentication, errors, routing, and state integration without duplicating policy.

### IV. Secure Session Handling

Access tokens MUST remain in memory and MUST NOT be persisted in `localStorage` or
`sessionStorage`. Session restoration MUST rely on a backend-issued `HttpOnly` and
`Secure` cookie sent through `withCredentials`. Authentication state MUST be resolved
before the application mounts and before route guards make access decisions.
Protected-endpoint `401` responses MUST clear client authentication state, while
authentication endpoints MUST retain their explicit bypass behavior. Secrets and
production API endpoints MUST come from environment configuration, never committed
defaults.

Rationale: These rules reduce persistent token exposure, avoid incorrect first
renders, and keep expired sessions synchronized between the Laravel API and Vue UI.

### V. Explicit Domain Contracts and Verification

API contracts MUST be documented beside each service, including endpoint, payload,
query, and response-shape assumptions. Laravel response envelopes and request payload
coercion MUST be normalized at the service boundary. HTTP failures MUST be converted
to the shared `HttpError` shape before reaching stores or views. Domain constants,
labels, statuses, priorities, date mapping, and calendar mapping MUST have one source
of truth under the owning module's `types/` area. Every behavior change MUST include
automated coverage at the lowest effective level; when the repository lacks the
required harness, the implementation plan MUST add it or document a concrete manual
verification procedure and the reason automation is deferred.

Rationale: Stable boundaries protect projects, tasks, schedules, and Telegram
notification behavior from inconsistent payloads and duplicated domain rules.

## Architecture and Technology Constraints

- The application remains a Vue 3 SPA using Composition API and `<script setup>`.
- Vite is the build system and `@` is the canonical alias for `src/`.
- Vue Router 4 owns navigation and route guards; feature modules contribute routes.
- Vuex 4 namespaced modules are the current state source of truth. Pinia MUST NOT be
  introduced incrementally; migration requires a constitution amendment and a
  repository-wide migration plan.
- Axios access MUST be confined to the shared HTTP client and feature services.
- FullCalendar integration MUST receive mapped domain events rather than raw task
  payloads.
- Server-confirmed state is authoritative. Mutations that affect project, task,
  schedule, or notification data MUST re-synchronize affected state unless an
  explicitly designed and verified optimistic strategy replaces that behavior.

## Development Workflow and Quality Gates

1. Specifications MUST identify the owning feature module, affected domain contracts,
   security impact, and independently testable acceptance scenarios.
2. Plans MUST pass the Constitution Check before design and again after design.
3. Tasks MUST name exact paths, preserve layer order, and include contract/error,
   security, and verification work where applicable.
4. Reviews MUST reject direct View-to-HTTP access, feature rules in `core/`, duplicated
   domain constants, persistent access tokens, or unnormalized transport errors.
5. Changes to API contracts or cross-module mappings MUST include integration or
   contract verification. UI-only behavior MUST include component-level or documented
   acceptance verification.
6. Documentation in `ARQUITETURA.md` MUST be updated when a decision, module boundary,
   dependency flow, or end-to-end flow changes.

## Governance

This constitution supersedes conflicting project conventions and templates.
Amendments require a documented rationale, an impact assessment for existing modules
and templates, and approval through the project's normal review process. Breaking
changes to a principle or removal of a governance guarantee require a MAJOR version;
new principles or materially expanded requirements require a MINOR version; wording
clarifications require a PATCH version. Every feature plan and code review MUST record
constitution compliance, and any exception MUST identify its scope, owner, migration
path, and removal condition. `ARQUITETURA.md` is the runtime architecture guide and
MUST remain consistent with this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-07-26 | **Last Amended**: 2026-07-26
