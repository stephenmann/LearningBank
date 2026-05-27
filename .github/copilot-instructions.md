# Learning Bank — GitHub Copilot Instructions

> A teaching tool that gives children a safe, parent-supervised online-banking experience so they learn how money, deposits, savings, and spending decisions work in real life.

These instructions are the source of truth for AI-assisted contributions to this repository. Follow them strictly. When a request conflicts with these instructions, ask for clarification before proceeding.

---

## 1. Product Overview

**Learning Bank** is a web application modeled after a modern online-banking experience, scaled down and made safe for children. It has two distinct user experiences sharing one platform:

### Child (Learner) Experience
- Dashboard showing a **Checking** account and a **Savings** account.
- Each account displays a running balance and a chronological list of transactions.
- Submit **deposits** of physical money or gift cards. Each deposit must be tagged with a **category** (e.g., Allowance, Birthday Gift, Chore Earnings, Gift Card). Deposits enter the checking account.
- Transfer money **Checking → Savings** instantly, when funds are available.
- Request a transfer **Savings → Checking**. The request is recorded as `Pending` and only completes when a parent approves it.
- Read-only visibility into withdrawals entered by the parent.

### Parent (Teacher / Administrator) Experience
- All child capabilities, plus administrative controls.
- Enter deposits on behalf of the child.
- Enter **withdrawals** to reflect real-world spending (purchases, allowance taken back, etc.).
- Approve or reject pending Savings → Checking transfer requests.
- Manage the **category catalog**: create, edit, archive deposit categories and decide which categories children are allowed to use.
- Manage child accounts (create, link, suspend).
- Parent is the **administrator role** for the platform.

### Authentication
- Single sign-on via **OpenID Connect (OIDC)**.
- Supported identity providers: **Google** and **Microsoft (Entra ID / personal Microsoft accounts)**.
- No local username/password store. All identity is delegated to the IdP.

---

## 2. Technology Stack (Authoritative)

When generating code, default to these choices. Do not introduce alternatives without explicit approval.

### Backend
- **Language:** C# on **.NET 9** (latest LTS-track release at time of writing).
- **Framework:** ASP.NET Core Web API (minimal APIs preferred for endpoints, MVC controllers acceptable for complex resource groups).
- **Auth:** `Microsoft.AspNetCore.Authentication.OpenIdConnect` + `Microsoft.AspNetCore.Authentication.JwtBearer`. Wire two OIDC schemes (Google, Microsoft) plus a cookie scheme for session.
- **ORM:** **Entity Framework Core 9** with the provider matching the deployment target (SQLite for local, Azure SQL or PostgreSQL for cloud — see §4).
- **Validation:** `FluentValidation`.
- **Logging:** `Serilog` with structured JSON output; sink to console locally and to Application Insights in Azure.
- **Testing:** `xUnit` + `FluentAssertions` + `Microsoft.AspNetCore.Mvc.Testing` for integration tests.

### Frontend
- **Runtime:** **Node.js 22 LTS** (latest LTS). Pin the exact version in `.nvmrc` and `package.json#engines`.
- **Framework:** **Next.js 15** (App Router, React Server Components, TypeScript strict mode).
- **Language:** **TypeScript 5.x** with `"strict": true` and `"noUncheckedIndexedAccess": true`.
- **Styling:** **Wise-design-analysis** as specified in DESIGN.MDV(see §6). Use `@layer components` for reusable patterns. Avoid inline style objects except for dynamic values.
- **State / data fetching:** **TanStack Query v5** for server state; **Zustand** for any cross-page client state. No Redux.
- **Forms:** **React Hook Form** + **Zod** resolver for schemas shared with the API where practical.
- **Auth client:** **NextAuth.js v5 (Auth.js)** configured with Google and Microsoft Entra providers, issuing a session cookie that the backend validates as a bearer token (or call the backend through Next.js route handlers acting as a BFF — prefer this pattern).
- **Icons:** **Lucide React**.
- **Testing:** **Vitest** for unit, **Playwright** for end-to-end.

### Auxiliary Tooling (Python)
- **Python 3.13** is permitted for one-off **scripts only** (data seed scripts, migration helpers, batch jobs). Not for production runtime code. Keep these in `/scripts/` and document each script's purpose at the top of the file.

### Dependency Policy
- Always pick the **latest stable** version of every package at the time of install.
- Run `dotnet outdated` (or `dotnet list package --outdated`) and `npm outdated` / `npx npm-check-updates` on every PR that touches dependencies.
- Renovate or Dependabot must be enabled (see §8).
- Never pin to a vulnerable version. CVE-flagged packages block the PR.

---

## 3. Repository Layout

```
/
├── .github/
│   ├── copilot-instructions.md      ← this file
│   └── workflows/
│       ├── ci.yml                    ← manually run build, test, lint
│       ├── deploy-azure.yaml         ← manual deploy using staging slots + swap
│       └── deploy-azure-noslots.yaml ← manual deploy directly to production
├── src/
│   ├── LearningBank.Api/             ← ASP.NET Core Web API (.NET 9)
│   ├── LearningBank.Domain/          ← entities, value objects, domain rules
│   ├── LearningBank.Infrastructure/  ← EF Core, external integrations
│   └── learning-bank-web/            ← Next.js 15 frontend
│       └── public/images/            ← static image assets (learning-bank-icon.svg, learning-bank-logo.svg, etc.)
├── tests/
│   ├── LearningBank.Api.Tests/
│   ├── LearningBank.Domain.Tests/
│   └── LearningBank.Web.E2E/         ← Playwright
├── scripts/                          ← Python helpers, seed data, dev utilities
├── infra/
│   └── azure/                        ← Bicep templates for App Service + DB
├── docs/
├── .editorconfig
├── .nvmrc
├── global.json                        ← pin .NET SDK
├── LearningBank.sln
└── README.md
```

---

## 4. Hosting & Data (Cost-Minimized)

The platform must run cheaply. Pick the smallest tier that satisfies the requirement; document any upgrade.

### Azure (production)
- **Compute:** Azure **App Service Linux** on the **B1** plan (or **F1 Free** for very early demos). One plan hosts both the API and the Next.js app as separate App Service instances, or as a single combined deployment if cost-pressure demands.
- **Database:** **Azure SQL Database — Serverless, General Purpose, 0.5 vCore min, auto-pause after 1 hour idle.** This is the default. Alternative: **Azure Database for PostgreSQL Flexible Server — Burstable B1ms** if Postgres is preferred. Pick one and commit; do not mix.
- **Secrets:** **Azure Key Vault** (standard tier) referenced from App Service via managed identity. Never put secrets in `appsettings.json`.
- **Observability:** **Application Insights** with the free 5 GB/month ingestion cap. Sampling on.
- **CDN / static assets:** Next.js handles static caching; no separate CDN until traffic justifies it.
- **TLS / domain:** Use the free `*.azurewebsites.net` hostname initially. App Service Managed Certificate when a custom domain is added.

### Local Development
- **Database:** **SQLite** file in `/src/LearningBank.Api/App_Data/learningbank.dev.db`. EF Core provider switched via configuration: `Database:Provider = "Sqlite" | "SqlServer" | "Postgres"`.
- **Auth:** Use real Google + Microsoft OIDC against test app registrations. Document redirect URIs (`http://localhost:3000/api/auth/callback/<provider>`).
- **Run:** `dotnet run` for the API on `https://localhost:5001`, `npm run dev` for the web on `http://localhost:3000`. A root `docker-compose.yml` and a `make dev` target (or `./dev.ps1`) start both together.

The same code must run unchanged in both environments. Differences live in configuration only.

---

## 5. Domain Rules (Enforce in Code, Not Just UI)

These rules are invariants. They must be enforced server-side in the domain layer, validated again at the API boundary, and reflected in the UI.

1. **Money** is represented as `decimal` in C# and `string` (decimal-formatted) over the wire. Never use `double` or `float` for money. Currency is USD only for v1.
2. A **transaction** is immutable once posted. Corrections are issued as new offsetting transactions, never edits.
3. **Deposits** require a non-archived, child-allowed **Category**. The category must be validated at the moment of submission, not just when the form loads.
4. **Checking → Savings** transfers are atomic: a single domain operation that debits checking and credits savings in one transaction. Reject if checking balance would go negative.
5. **Savings → Checking** requests create a `TransferRequest` entity with status `Pending`. Only a parent linked to that child may transition it to `Approved` or `Rejected`. Approval performs the atomic debit/credit; rejection leaves balances untouched. The child can cancel a pending request before approval.
6. **Withdrawals** can only be entered by a parent. The corresponding child sees them as read-only transactions.
7. **Balances are derived**, not stored. Compute by summing posted transactions for the account. Cache derivations only with explicit invalidation; do not denormalize without a written justification.
8. **Authorization** is role-based: `Parent` and `Child`. Every endpoint must declare `[Authorize(Roles = "...")]` or equivalent policy. A parent may only act on children they are linked to — enforce via policy, not just role.
9. **Audit log**: every administrative action (category change, child permission change, transfer approval, withdrawal entry) writes an audit record with actor, target, before/after, and timestamp.

---

## 6. Design System — Stripe-Inspired

Use DESIGN.md as the source of truth for the design system. When generating code, refer to it for exact values and usage guidelines.

### Tone
- Child-facing copy: warm, encouraging, concrete. Avoid jargon. Celebrate savings milestones with small visual touches (no gamification gimmicks — Stripe-style restraint).
- Parent-facing copy: calm, precise, factual. Treat the parent as a competent adult administrator.

### Accessibility
- WCAG 2.2 AA minimum.
- Color is never the only signal. Pair color with icon and text.
- All interactive elements have visible focus rings using `--lb-indigo-600`.
- Keyboard support is mandatory for every flow, including transfer approvals.

---

## 7. Coding Conventions

### General
- Prefer composition over inheritance. Small, single-purpose modules.
- No dead code. No `TODO` without a tracked issue number.
- No secrets, no PII, no real names in fixtures or seed data.

### C# / .NET
- Nullable reference types **enabled** project-wide.
- `async`/`await` everywhere I/O happens. Never `.Result` or `.Wait()`.
- File-scoped namespaces. `var` when the type is obvious from the right-hand side.
- One class per file. Records for DTOs and value objects.
- Domain layer has zero references to ASP.NET, EF Core, or any infrastructure assembly.

### TypeScript / React
- Functional components only. No class components.
- `interface` for public-facing object shapes, `type` for unions and utilities.
- Server Components by default in Next.js App Router. Mark `"use client"` only when required (state, effects, browser APIs).
- Co-locate component, styles, and tests in the same folder.
- Never call the backend directly from a Client Component — go through a route handler or Server Action.

### Naming
- C#: `PascalCase` for types and public members, `_camelCase` for private fields.
- TypeScript: `PascalCase` for components and types, `camelCase` for everything else.
- Files: components in `PascalCase.tsx`, hooks in `useCamelCase.ts`, utilities in `kebab-case.ts`.

### Error Handling
- API returns RFC 7807 `application/problem+json` for all errors.
- Frontend renders user-friendly messages; never expose stack traces or raw error strings to the child experience.
- All errors are logged with correlation ID propagated across API and frontend.

---

## 8. CI/CD

### GitHub Actions Workflows

**`ci.yml`** — runs on manual workflow dispatch:
1. Checkout
2. Setup .NET 9, Node 22
3. Restore + build .NET solution
4. `dotnet test` with coverage
5. `npm ci` + `npm run lint` + `npm run typecheck` + `npm run test` + `npm run build`
6. Upload coverage to PR
7. Run `dotnet list package --vulnerable` and `npm audit --omit=dev` — fail on high/critical
8. CodeQL analysis

**`deploy-azure.yaml`** — runs on manual workflow dispatch from `main`:
1. Build API as self-contained Linux x64 publish
2. Build Next.js as standalone output
3. Authenticate to Azure via OIDC federated credential (no stored secrets)
4. Configure staging slot app settings for API and web
5. Deploy API to `learningbank-api` slot `staging`, run EF Core migrations, smoke test, swap to `production`
6. Deploy web to `learningbank-web` slot `staging`, smoke test, swap to `production`
7. Post deployment summary to the workflow run

**`deploy-azure-noslots.yaml`** — runs on manual workflow dispatch from `main`:
1. Build API and web outputs
2. Configure production app settings
3. Run EF Core migrations
4. Deploy API and web directly to production apps and run smoke tests

Deployments must remain **idempotent**; prefer the slot-based workflow when rollback safety is required.

### Dependency Automation
- **Dependabot** enabled for `nuget`, `npm`, `github-actions`, and `dockerfile` ecosystems. Weekly cadence. Auto-merge minor/patch updates after CI passes.

---

## 9. Security Requirements

- **OIDC** is the only authentication mechanism. No password storage, ever.
- **PKCE** required on all OIDC flows.
- **Session cookies** are `HttpOnly`, `Secure`, `SameSite=Lax`, signed and encrypted.
- **CSRF** protection on every state-changing endpoint (anti-forgery tokens for cookie-auth requests).
- **CORS** is locked to known origins; no wildcards in production.
- **Rate limiting** on every endpoint (`AspNetCoreRateLimit` or built-in `Microsoft.AspNetCore.RateLimiting`).
- **Input validation** at the API boundary using FluentValidation; never trust client validation alone.
- **No PII in logs.** Mask emails to `a***@domain.com` in any log line.
- **COPPA-aware:** the child experience collects no marketing data, no third-party analytics, no advertising trackers. Application Insights is configured to scrub IPs and disable user tracking on child routes.
- **Backups:** Azure SQL automated backups retained 7 days minimum.

---

## 10. When Generating Code

When acting as Copilot in this repo, always:

1. **Read this file first.** Restate the relevant rule in your own words before proposing code that touches it.
2. **Honor the stack.** Do not introduce a new library, framework, or pattern without flagging it explicitly and explaining why an existing tool is insufficient.
3. **Enforce domain rules in the domain layer first**, then the API, then the UI. Not the reverse.
4. **Prefer the smallest change** that satisfies the request. No drive-by refactors.
5. **Write tests** alongside any non-trivial change. A bug fix includes a regression test.
6. **Match the design tokens** exactly. Do not invent colors, spacing values, or font weights.
7. **Ask before changing** anything in `/infra`, `/.github/workflows`, dependency versions, or authentication configuration. These are high-blast-radius.
8. **Cost is a feature.** If a suggestion increases Azure spend, call it out and offer the cheaper alternative.

---

## 11. Out of Scope (v1)

To keep the surface small and the cost low, the following are **not** part of v1:

- Real money movement, ACH, card networks, or any regulated financial flow. This is a teaching tool.
- Multi-currency support.
- Mobile apps (the web app must be responsive and touch-friendly, but no React Native / MAUI).
- Notifications (email, SMS, push). Add in v2 once the core loop is validated.
- Interest accrual or scheduled transfers — explicitly deferred.

If a feature request lands in one of these areas, surface it as a v2 candidate; do not implement it on the side.

---

*Last updated: 2026-05-26*
