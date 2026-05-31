# Infrastructure Component Documentation

## Azure IaC (Bicep)

In addition to the C# infrastructure project, Azure hosting resources are defined with Bicep templates.

Location:
- infra/azure/main.bicep
- infra/azure/modules/app-service-plan.bicep
- infra/azure/modules/web-app.bicep
- infra/azure/modules/web-app-slot.bicep

Provisioned resources:
- Linux App Service plan
- API App Service (learningbank-api)
- Web App Service (learningbank-web)
- Optional staging slots for API and Web apps

Deployment behavior:
- .github/workflows/deploy-azure-prod.yaml deploys Bicep with createStagingSlots=true.
- .github/workflows/deploy-azure-dev.yaml deploys Bicep with createStagingSlots=false.
- Deployments are idempotent via az deployment group create.

Primary template parameters:
- appServicePlanName
- apiAppName
- webAppName
- createStagingSlots
- slotName
- appServicePlanSkuName
- appServicePlanSkuTier
- apiAuthAuthority
- apiAuthAudience
- nextAuthUrl
- nextPublicApiUrl
- googleClientId
- googleClientSecret (secure)
- azureAdClientId
- azureAdClientSecret (secure)
- azureAdTenantId
- authSecret (secure)
- enableSql (provisions Azure SQL server + serverless database; default true)
- sqlServerName
- sqlDatabaseName
- sqlAdminIdentityName (user-assigned identity used as the SQL Entra admin)
- deployPrincipalObjectId (deploy SP object id, granted db_ddladmin for migrations)
- enableFrontDoorDnsRecords (optional; reconciles apex/www Azure DNS records to Front Door)
- frontDoorDnsZoneName (optional; Azure DNS zone name when DNS reconciliation is enabled)

The passwordless API connection string is computed from the provisioned SQL
server/database and exposed as the `apiConnectionString` deployment output
(alongside `sqlServerFqdn` and `sqlDatabaseName`). The contained database users
for the app/slot/deploy identities are created by an in-template deployment
script that runs as the SQL Entra admin identity.

Automated runtime configuration:
- API and Web app settings are declared in Bicep and applied during az deployment group create.
- Slot workflow applies the same settings to staging slots.
- No separate az webapp config appsettings set step is required.

## Scope
The infrastructure project is in src/LearningBank.Infrastructure and implements persistence and data access for domain contracts using Entity Framework Core.

## Responsibilities
- Configure EF Core DbContext and entity mappings.
- Implement domain repository interfaces.
- Manage database provider selection by configuration.
- Expose a single DI extension for the API host.
- Hold EF migrations.

## Dependency Direction
Infrastructure depends on:
- LearningBank.Domain (entities and repository interfaces)
- EF Core provider packages

Infrastructure is consumed by:
- LearningBank.Api via AddInfrastructure

## Service Registration
File: src/LearningBank.Infrastructure/InfrastructureServiceExtensions.cs

AddInfrastructure reads Database:Provider and configures DbContext:
- SqlServer provider when Database:Provider is SqlServer
- Sqlite provider otherwise

Default Sqlite connection string:
- Data Source=App_Data/learningbank.dev.db

Repositories registered as scoped services:
- UnitOfWork
- UserRepository
- TransactionRepository
- CategoryRepository
- TransferRequestRepository
- AuditLogRepository

## DbContext
File: src/LearningBank.Infrastructure/Data/LearningBankDbContext.cs

DbSets:
- Users
- ChildLinks
- Categories
- Transactions
- TransferRequests
- AuditLogs

Configuration strategy:
- ApplyConfigurationsFromAssembly to auto-load IEntityTypeConfiguration classes.

## Entity Configurations
Location: src/LearningBank.Infrastructure/Data/Configurations

### TransactionConfiguration highlights
- Amount column type decimal(18,4)
- Description max length 500
- Child foreign key with cascade delete
- Category foreign key with restrict delete
- Indexes on child plus account and posted timestamp

Other configuration files:
- UserConfiguration
- ChildLinkConfiguration
- CategoryConfiguration
- TransferRequestConfiguration
- AuditLogConfiguration

## Migrations
Location: src/LearningBank.Infrastructure/Data/Migrations

Current migration set includes:
- InitialCreate migration and designer
- LearningBankDbContextModelSnapshot

Migration assembly is explicitly set to LearningBank.Infrastructure in provider options.

## Repository Implementations
Location: src/LearningBank.Infrastructure/Repositories

Implemented repository classes:
- UserRepository
- TransactionRepository
- CategoryRepository
- TransferRequestRepository
- AuditLogRepository
- UnitOfWork

Repository purpose:
- Translate domain repository contract calls into EF queries and writes.
- Keep API and domain free from EF-specific logic.

## Operational Notes
Local development:
- Uses Sqlite file under src/LearningBank.Api/App_Data when configured.

Production direction:
- Supports SqlServer provider switching through configuration.

Startup behavior:
- API applies migrations at startup using this DbContext.

## Known Gaps and Follow-ups
- Postgres provider branch is not yet implemented in AddInfrastructure.
- There are no infrastructure-level integration tests yet.
- Performance profiling and query-level metrics are not yet documented.

## Extension Guidance
When adding new persistence features:
1. Add domain contract changes first in LearningBank.Domain.
2. Implement repository method in LearningBank.Infrastructure.
3. Add or update EF configuration for new fields and indexes.
4. Create migration and validate startup migration path.
5. Add integration tests for non-trivial query behavior.
