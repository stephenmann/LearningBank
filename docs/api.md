# API Component Documentation

## Scope
The API project is in src/LearningBank.Api and exposes the Learning Bank backend as ASP.NET Core minimal API endpoints under /api/v1.

## Responsibilities
- Authenticate and authorize requests using JWT bearer authentication and role-based policies.
- Enforce role and parent-child link constraints at endpoint boundaries.
- Validate incoming payloads with FluentValidation.
- Delegate business invariants to the domain layer.
- Persist state through repository abstractions implemented by infrastructure.
- Emit audit log entries for administrative actions.

## Runtime and Startup
- Entry point: src/LearningBank.Api/Program.cs
- Environment configuration: src/LearningBank.Api/appsettings.json and appsettings.Development.json
- Infrastructure registration: AddInfrastructure from LearningBank.Infrastructure

Startup pipeline includes:
1. Serilog configuration
2. EF Core and repository DI via AddInfrastructure
3. JWT authentication
4. Claims transformation for user bootstrap and role claim augmentation
5. Authorization policies Parent and Child
6. FluentValidation registration
7. CORS for frontend origin
8. Global fixed-window rate limiting (100 requests per minute key partition)
9. Route registration under /api/v1

## Authentication and Authorization
Authentication:
- Scheme: JwtBearerDefaults.AuthenticationScheme
- Authority: Auth:WebAppUrl
- Audience: Auth:Audience defaulting to learning-bank-api

Authorization policies:
- Parent policy: requires role Parent
- Child policy: requires role Child

Helper extensions live in src/LearningBank.Api/Auth/AuthHelpers.cs and are used to extract user identity and role from claims.

## Endpoint Groups
Registered route group: /api/v1

### User Endpoints
File: src/LearningBank.Api/Endpoints/UserEndpoints.cs
- GET /me
- GET /children
- POST /children

Behavior notes:
- Create child records a Child user and a ChildLink to the parent.
- Child creation writes an audit record.

### Category Endpoints
File: src/LearningBank.Api/Endpoints/CategoryEndpoints.cs
- GET /categories
- POST /categories
- PUT /categories/{id}
- POST /categories/{id}/archive
- POST /categories/{id}/unarchive

Behavior notes:
- Parent sees all categories, child sees active child-allowed categories.
- Mutating category actions write audit records.

### Account Endpoints
File: src/LearningBank.Api/Endpoints/AccountEndpoints.cs
- GET /children/{childId}/accounts/checking
- GET /children/{childId}/accounts/savings

Behavior notes:
- Child can only view own data.
- Parent can only view linked children.
- Balance is derived from transaction sums, never stored.

### Transaction and Transfer Endpoints
File: src/LearningBank.Api/Endpoints/TransactionEndpoints.cs
- POST /deposits
- POST /withdrawals
- POST /transfers/checking-to-savings
- POST /transfers/savings-to-checking
- GET /transfers/requests/pending
- GET /children/{childId}/transfers/requests
- POST /transfers/requests/{requestId}/review
- DELETE /transfers/requests/{requestId}

Behavior notes:
- Deposits validate category availability at submission time.
- Withdrawal is parent-only and audited.
- Checking to savings uses AccountService atomic pair creation with insufficient funds guard.
- Savings to checking is request based and requires parent review.
- Approval/rejection actions are audited.

## DTOs and Validation
DTOs live under src/LearningBank.Api/Dtos:
- UserDtos.cs
- CategoryDtos.cs
- TransactionDtos.cs
- TransferDtos.cs

Validators live in src/LearningBank.Api/Validators/RequestValidators.cs and are registered at startup.

## Error Handling
- Non-development environment uses exception handler returning RFC 7807 style payload with status 500.
- Domain failures such as insufficient funds are mapped to 422 responses.
- Rate limit rejections return 429.

## Health and Observability
- Health endpoint: GET /health
- Request logging: app.UseSerilogRequestLogging
- Minimum logging levels are configured in appsettings files.

## Data Flow Summary
1. Request enters API endpoint.
2. Claims are transformed and role is resolved.
3. Endpoint authorizes actor and validates input.
4. Domain entities/services enforce financial invariants.
5. Repository operations execute in infrastructure context.
6. Unit of work commits transaction.
7. Response DTO is returned.

## Testing Status
- Project exists for API tests at tests/LearningBank.Api.Tests.
- Current repo state has no API integration test classes yet.

## Recommended Next Improvements
- Add integration tests using Microsoft.AspNetCore.Mvc.Testing.
- Add explicit problem details payload model for all non-success responses.
- Add OpenAPI generation for endpoint discoverability.
