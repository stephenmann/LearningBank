# Web Component Documentation

## Scope
The web frontend is in src/learning-bank-web and is built with Next.js 15 App Router and TypeScript strict mode.

## Responsibilities
- Provide child and parent user experiences.
- Authenticate users through NextAuth with Google and Microsoft providers.
- Render account views and parent admin workflows.
- Use a Backend For Frontend pattern through route handlers under src/app/api.
- Keep client-side components free from direct backend calls where possible.

## Runtime and Tooling
- Node engine: >=22.0.0
- Framework: next 15.3.2
- Auth: next-auth v5 beta
- Forms: react-hook-form with zod resolver
- Testing: vitest

Key files:
- src/learning-bank-web/package.json
- src/learning-bank-web/tsconfig.json
- src/learning-bank-web/next.config.ts
- src/learning-bank-web/vitest.config.ts

## Application Structure
### App Router pages
Location: src/learning-bank-web/src/app

Primary routes:
- / sign-in redirect gateway
- /sign-in public auth entry
- /dashboard child and parent account overview
- /parent/children parent child management
- /parent/categories parent category management

Shared layout:
- Root layout: src/app/layout.tsx
- Authenticated shell layout: src/app/(app)/layout.tsx

### Components
Location: src/learning-bank-web/src/components

Core components:
- DashboardClient, AccountCard, TransactionList
- DepositForm and TransferForm
- AppNav

Parent components:
- parent/ChildrenClient
- parent/CategoriesClient
- parent/PendingRequestsClient

### Route Handlers (BFF)
Location: src/learning-bank-web/src/app/api

Implemented handlers:
- auth/[...nextauth]
- deposits
- withdrawals
- transfers/checking-to-savings
- transfers/savings-to-checking
- transfers/requests/[id]/review
- categories
- categories/[id]
- categories/[id]/archive
- categories/[id]/unarchive
- children

These handlers proxy requests to backend API routes under /api/v1.

## Authentication and Session
File: src/learning-bank-web/src/lib/auth.ts

Configured providers:
- Google
- Microsoft Entra ID using common issuer

Session strategy:
- JWT strategy
- Session callback injects user id and provider metadata
- Cookie options include HttpOnly and SameSite Lax

## Data Access Layer
Files:
- src/learning-bank-web/src/lib/api-client.ts
- src/learning-bank-web/src/lib/server-api.ts
- src/learning-bank-web/src/types/api.ts

Pattern:
1. Server components call server-api helpers.
2. server-api retrieves token via auth.
3. api-client sends requests to NEXT_PUBLIC_API_URL.
4. DTOs are typed using interfaces in types/api.ts.

## Route Protection
File: src/learning-bank-web/src/middleware.ts

Middleware redirects unauthenticated access for:
- /dashboard
- /parent

Exclusions include:
- /api/auth
- Next static assets
- /sign-in

## Styling and Assets
- Global styles and design tokens: src/learning-bank-web/src/app/globals.css
- Static images: src/learning-bank-web/public/images

## Environment Variables
Template file: src/learning-bank-web/.env.example

Detailed setup guide:
- docs/auth-setup.md

Required values:
- AUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- AZURE_AD_CLIENT_ID
- AZURE_AD_CLIENT_SECRET
- NEXT_PUBLIC_API_URL
- NEXTAUTH_URL

## Commands
From src/learning-bank-web:
- npm run dev
- npm run build
- npm run typecheck
- npm run test

## Testing Status
- Vitest is configured with jsdom and setup file.
- No component test suites are committed yet.

## Known Gaps and Follow-ups
- docker-compose expects a web Dockerfile but src/learning-bank-web/Dockerfile is not present.
- Additional end-to-end tests are not yet implemented.
- Parent withdrawal-focused dedicated page flow can be expanded if required.

## Extension Guidance
When adding frontend features:
1. Add or extend backend endpoint and DTO first when behavior changes data contracts.
2. Add or extend BFF route handler under src/app/api.
3. Keep data fetching in server components or route handlers.
4. Use client components only for interactive UI concerns.
5. Add Vitest and Playwright coverage for critical paths.
