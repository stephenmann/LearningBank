# Domain Component Documentation

## Scope
The domain project is in src/LearningBank.Domain and contains business entities, value enums, domain services, exceptions, and repository contracts.

Design intent:
- Keep domain independent from ASP.NET Core, EF Core, and infrastructure concerns.
- Encode business invariants directly in entity methods and domain services.

## Core Domain Rules Encoded
1. Money uses decimal and not floating-point types.
2. Transactions are immutable after posting.
3. Deposits require valid category checks at application boundary.
4. Checking to savings transfer must be atomic and cannot overdraw checking.
5. Savings to checking transfer must be requested and parent-reviewed.
6. Withdrawals are parent-entered actions.
7. Balances are derived from transactions.
8. Authorization constraints are enforced at API policy and actor checks.
9. Administrative actions produce audit entries.

## Entities
### User
File: src/LearningBank.Domain/Entities/User.cs
- Represents parent or child actor.
- Includes identity provider mapping and account status.
- Child relationships represented via ChildLink.

### ChildLink
File: src/LearningBank.Domain/Entities/ChildLink.cs
- Links a parent user to a child user.
- Prevents linking a user to self.

### Category
File: src/LearningBank.Domain/Entities/Category.cs
- Deposit categorization model.
- Supports create, update, archive, and unarchive operations.

### Transaction
File: src/LearningBank.Domain/Entities/Transaction.cs
- Immutable ledger entry.
- Factory methods:
  - CreateDeposit
  - CreateWithdrawal
  - CreateCheckingToSavingsTransfer
  - CreateSavingsToCheckingTransfer
- Transfer factories produce a matched debit and credit pair with related transaction IDs.

### TransferRequest
File: src/LearningBank.Domain/Entities/TransferRequest.cs
- Captures savings to checking request workflow.
- State lifecycle: Pending to Approved, Rejected, or Cancelled.
- Invalid transition attempts throw DomainException.

### AuditLog
File: src/LearningBank.Domain/Entities/AuditLog.cs
- Records admin actions with actor, target, and before/after metadata.

## Enums
- AccountType
- TransactionType
- TransferRequestStatus
- UserRole

All are located under src/LearningBank.Domain/Entities.

## Domain Services
### AccountService
File: src/LearningBank.Domain/Services/AccountService.cs
Responsibilities:
- Derive account balances from transaction streams.
- Validate available funds for transfer operations.
- Produce transfer debit and credit pairs by delegating to Transaction factory methods.

Methods:
- GetBalance
- CheckingToSavings
- SavingsToChecking

## Exceptions
- DomainException: base domain-level invariant violation.
- InsufficientFundsException: specialized error for overdraft prevention.

Files:
- src/LearningBank.Domain/Exceptions/DomainException.cs
- src/LearningBank.Domain/Exceptions/InsufficientFundsException.cs

## Repository Contracts
Repository interfaces define persistence operations without choosing storage:
- IUserRepository
- ITransactionRepository
- ICategoryRepository
- ITransferRequestRepository
- IAuditLogRepository
- IUnitOfWork

Location: src/LearningBank.Domain/Repositories.

## Dependency Boundary
Allowed inward dependencies:
- None on web framework or persistence implementation.

Consumers of this project:
- src/LearningBank.Api for endpoint orchestration.
- src/LearningBank.Infrastructure for concrete repository implementation.

## Testing
Domain tests currently implemented:
- tests/LearningBank.Domain.Tests/AccountServiceTests.cs
- tests/LearningBank.Domain.Tests/CategoryTests.cs
- tests/LearningBank.Domain.Tests/TransferRequestTests.cs

These cover key invariants for balances, transfer constraints, and state transitions.

## Extension Guidance
When adding new domain behavior:
1. Add or update entity or service methods first.
2. Keep invariants in domain code, not only in API validation.
3. Add domain unit tests before wiring API or persistence layers.
4. Expose persistence requirements through repository interfaces only.
