# Environment Setup Guide

This guide explains every required environment value for local development, what it is used for, and how to obtain it.

## Files Used
- Web environment template: src/learning-bank-web/.env.example
- Local web environment file (do not commit): src/learning-bank-web/.env.local
- API base config: src/LearningBank.Api/appsettings.json

## Quick Start
1. Copy src/learning-bank-web/.env.example to src/learning-bank-web/.env.local.
2. Fill in all required values from the sections below.
3. Start the app with ./dev.ps1.

## Variable Reference

### AUTH_SECRET
Purpose:
- Secret used by NextAuth to sign and encrypt auth/session tokens.

How to generate:
- Open terminal in repository root.
- Run one of:
  - PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  - OpenSSL (if installed): openssl rand -base64 32

Notes:
- Use a unique value per environment.
- Rotate if it is ever exposed.

### GOOGLE_CLIENT_ID
Purpose:
- OAuth client identifier for Google sign-in.

How to get it:
1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs and Services, then Credentials.
4. Create OAuth 2.0 Client ID as Web application.
5. Add authorized redirect URI:
   - http://localhost:3000/api/auth/callback/google
6. Copy the generated Client ID into GOOGLE_CLIENT_ID.

### GOOGLE_CLIENT_SECRET
Purpose:
- OAuth client secret paired with GOOGLE_CLIENT_ID.

How to get it:
- From the same Google OAuth client credential above, copy Client Secret.

Notes:
- Treat as secret and never commit to git.

### AZURE_AD_CLIENT_ID
Purpose:
- Application (client) ID for Microsoft Entra sign-in.

How to get it:
1. Open Azure Portal.
2. Go to Microsoft Entra ID, then App registrations.
3. Create or select an app registration.
4. Under Authentication, set Redirect URI (Web):
   - http://localhost:3000/api/auth/callback/microsoft-entra-id
5. Copy the Application (client) ID into AZURE_AD_CLIENT_ID.

### AZURE_AD_CLIENT_SECRET
Purpose:
- Client secret for the Microsoft Entra app registration.

How to get it:
1. In the app registration, open Certificates and secrets.
2. Create a new client secret.
3. Copy secret Value (not Secret ID) into AZURE_AD_CLIENT_SECRET.

Notes:
- Save the value immediately because it is shown once.
- Rotate and replace if exposed.

### AZURE_AD_TENANT_ID
Purpose:
- Controls which Microsoft Entra tenant issuer NextAuth uses for Microsoft sign-in.

Default local value:
- common

When to use common:
- Use common if you want to allow both personal Microsoft accounts and work or school accounts.

When to use a tenant GUID:
- Use your Directory (tenant) ID if your app registration is single-tenant or you only want accounts from one Entra tenant.

How to get a tenant GUID:
1. Open Azure Portal.
2. Go to Microsoft Entra ID.
3. Copy the Directory (tenant) ID.

Why this matters:
- If the tenant setting does not match the app registration supported account types, sign-in can succeed at Microsoft but fail when the app tries to complete local authentication.

### NEXT_PUBLIC_API_URL
Purpose:
- Base URL used by the web app BFF/API client to call backend endpoints.

Default local value:
- http://localhost:5001/api/v1

When to change:
- If your API runs on a different host, port, or route prefix.

### NEXTAUTH_URL
Purpose:
- Public URL where the Next.js app is reachable.

Default local value:
- http://localhost:3000

When to change:
- If you run the web app on another host or port.

## Detailed Auth Provider Setup

This section is a click-by-click guide for each identity provider.

### Google OAuth Setup Walkthrough

#### 1. Create or select a Google Cloud project
1. Go to https://console.cloud.google.com/.
2. Use the project picker in the top bar.
3. Create a new project or select an existing one for Learning Bank.

#### 2. Configure OAuth consent screen
1. In the left nav, open APIs and Services, then OAuth consent screen.
2. Choose External for local development unless your organization requires Internal.
3. Fill required app info:
  - App name
  - User support email
  - Developer contact email
4. Save and continue through scopes and test users.
5. Add your Google account under Test users if the app is in testing mode.

#### 3. Create OAuth client credentials
1. In APIs and Services, open Credentials.
2. Click Create Credentials, then OAuth client ID.
3. Application type: Web application.
4. Name it something clear, for example Learning Bank Local Web.
5. Add Authorized redirect URIs:
  - http://localhost:3000/api/auth/callback/google
6. Optional but recommended for local consistency, add Authorized JavaScript origins:
  - http://localhost:3000
7. Click Create.

#### 4. Copy values into local environment
1. Copy Client ID to GOOGLE_CLIENT_ID in src/learning-bank-web/.env.local.
2. Copy Client Secret to GOOGLE_CLIENT_SECRET in src/learning-bank-web/.env.local.

#### 5. Verify Google sign-in
1. Start the app with ./dev.ps1.
2. Go to http://localhost:3000/sign-in.
3. Click Continue with Google.
4. Confirm you return to the app without an OAuth error page.

### Microsoft Entra ID Setup Walkthrough

#### 1. Create or select an app registration
1. Go to https://portal.azure.com/.
2. Open Microsoft Entra ID.
3. Go to App registrations.
4. Create a new registration or select an existing one for Learning Bank.

#### 2. Choose supported account types correctly
1. In app registration Overview, check Supported account types.
2. Match this choice to AZURE_AD_TENANT_ID:
  - If AZURE_AD_TENANT_ID=common, use a multi-tenant option that allows personal Microsoft accounts.
  - If AZURE_AD_TENANT_ID is a tenant GUID, single-tenant is acceptable.
3. If they do not match, sign-in may succeed at Microsoft but fail in your app callback flow.

#### 3. Configure web redirect URI
1. In the app registration, open Authentication.
2. Add a platform if needed: Web.
3. Add Redirect URI:
  - http://localhost:3000/api/auth/callback/microsoft-entra-id
4. Save changes.

#### 4. Create client secret
1. Open Certificates and secrets.
2. Under Client secrets, click New client secret.
3. Add description and expiration.
4. Click Add.
5. Immediately copy the Value field.

#### 5. Confirm API permissions
1. Open API permissions.
2. Ensure Microsoft Graph delegated permission User.Read exists.
3. If needed, click Add a permission, then Microsoft Graph, then Delegated permissions, then User.Read.
4. Save and grant admin consent if your tenant policy requires it.

#### 6. Copy values into local environment
1. Copy Application (client) ID to AZURE_AD_CLIENT_ID in src/learning-bank-web/.env.local.
2. Copy Client secret Value to AZURE_AD_CLIENT_SECRET in src/learning-bank-web/.env.local.
3. Set AZURE_AD_TENANT_ID:
  - common for mixed personal plus organizational sign-ins.
  - Your Directory (tenant) ID for tenant-restricted sign-in.

#### 7. Verify Microsoft sign-in
1. Start the app with ./dev.ps1.
2. Go to http://localhost:3000/sign-in.
3. Click Continue with Microsoft.
4. Confirm you return to the app without an AADSTS error.

## OIDC Provider Configuration Checklist

### Google Checklist
- OAuth consent screen configured.
- Web application OAuth client created.
- Redirect URI added:
  - http://localhost:3000/api/auth/callback/google

### Microsoft Entra Checklist
- App registration created.
- Web redirect URI added:
  - http://localhost:3000/api/auth/callback/microsoft-entra-id
- Client secret value copied to .env.local.
- Supported account types match your AZURE_AD_TENANT_ID value.
  - Use Accounts in any organizational directory and personal Microsoft accounts if AZURE_AD_TENANT_ID=common.
  - Use a single-tenant app registration if AZURE_AD_TENANT_ID is a tenant GUID.

## Verification Steps
1. Start app with ./dev.ps1.
2. Open http://localhost:3000.
3. Open sign-in page and test both providers.
4. Confirm API health endpoint responds:
   - http://localhost:5001/health

## GitHub Actions Azure Deployment Requirements

This section documents everything required for .github/workflows/deploy-azure.yml to deploy successfully.

### What this workflow expects
- Workflow trigger: CI must complete successfully on main. Deployment runs from workflow_run.
- Azure App Service resources already exist:
  - API app name: learningbank-api
  - Web app name: learningbank-web
  - Slot name for both apps: staging
- The GitHub repository has all required Actions secrets configured.
- Azure OIDC federation is configured so GitHub Actions can sign in without a stored Azure password or publish profile.

### Required Azure resources (before first deployment)
1. Create or choose an Azure resource group.
2. Create App Service apps with the exact names expected by the workflow:
  - learningbank-api
  - learningbank-web
3. Create a staging deployment slot for each app:
  - learningbank-api/staging
  - learningbank-web/staging
4. Ensure your database exists and is reachable from GitHub Actions for EF migrations.
5. Confirm both production and staging slots have networking rules that allow deployment and smoke tests.

### Configure OIDC login for GitHub Actions (Azure login without client secret)

The deploy workflow uses azure/login@v2 with OIDC and requires these three secrets:
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_SUBSCRIPTION_ID

Setup steps:
1. Create an App Registration for deployment identity:
  - Azure Portal -> Microsoft Entra ID -> App registrations -> New registration.
  - Name suggestion: LearningBank GitHub Deploy.
  - Register the app.
2. Capture the three IDs required by deploy-azure.yml:
  - From App registration Overview:
    - Application (client) ID -> AZURE_CLIENT_ID
    - Directory (tenant) ID -> AZURE_TENANT_ID
  - From Subscription Overview:
    - Subscription ID -> AZURE_SUBSCRIPTION_ID
3. Add GitHub federated credential on the App Registration:
  - App registration -> Certificates and secrets -> Federated credentials -> Add credential.
  - Scenario: GitHub Actions deploying Azure resources.
  - Fill values:
    - Organization: your GitHub org or username
    - Repository: LearningBank
    - Entity type: Branch
    - Branch: main
  - Save.
4. Assign RBAC to the App Registration service principal:
  - Azure Portal -> Resource groups -> <your-resource-group> -> Access control (IAM) -> Add role assignment.
  - Role: Contributor.
  - Assign access to: User, group, or service principal.
  - Select the deployment App Registration service principal.
  - Save and wait 5 to 10 minutes for permissions to propagate.
5. Add required GitHub repository secrets:
  - GitHub -> Repository -> Settings -> Secrets and variables -> Actions -> Repository secrets.
  - Create:
    - AZURE_CLIENT_ID
    - AZURE_TENANT_ID
    - AZURE_SUBSCRIPTION_ID
    - AZURE_RESOURCE_GROUP
6. Confirm workflow permission and login inputs in deploy-azure.yml:
  - Top-level permissions include id-token: write and contents: read.
  - Azure login step uses:
    - client-id: ${{ secrets.AZURE_CLIENT_ID }}
    - tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    - subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
7. Validate OIDC end-to-end:
  - Push to main and let CI finish.
  - Confirm Deploy Azure starts from workflow_run.
  - Confirm Azure Login (OIDC) succeeds with no client secret or publish profile.
  - Confirm subsequent az webapp commands succeed.

OIDC troubleshooting quick checks:
- Ensure federated credential matches this exact repo and branch.
- Ensure workflow run is on main branch (not a different branch ref).
- Ensure AZURE_CLIENT_ID, AZURE_TENANT_ID, and AZURE_SUBSCRIPTION_ID are copied exactly.
- Ensure the service principal has Contributor (or equivalent required permissions) at the correct scope.
- If setup was just changed, rerun after propagation delay.

### Required GitHub repository secrets

Add these under GitHub -> Repository -> Settings -> Secrets and variables -> Actions -> Repository secrets.

Azure deployment/auth secrets:
- AZURE_CLIENT_ID: App Registration client ID used by OIDC login.
- AZURE_TENANT_ID: Tenant ID for the Azure directory.
- AZURE_SUBSCRIPTION_ID: Subscription containing the App Services.
- AZURE_RESOURCE_GROUP: Resource group name containing both apps.

API runtime/deploy secrets:
- API_CONNECTION_STRING: SQL connection string used for EF Core migration step.
- API_AUTH_AUTHORITY: OIDC authority that the API validates tokens against.
- API_AUTH_AUDIENCE: Expected audience for API tokens.

Web runtime secrets (applied to Azure Web App settings during deploy):
- AUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- AZURE_AD_CLIENT_ID
- AZURE_AD_CLIENT_SECRET
- AZURE_AD_TENANT_ID
- NEXTAUTH_URL
- NEXT_PUBLIC_API_URL

### Secret value guidance for production
- NEXTAUTH_URL: production web URL, for example https://learningbank-web.azurewebsites.net
- NEXT_PUBLIC_API_URL: production API base URL including route prefix, for example https://learningbank-api.azurewebsites.net/api/v1
- API_AUTH_AUTHORITY and API_AUTH_AUDIENCE: must match the token issuer/audience used by your production auth model.
- API_CONNECTION_STRING: should target production database and use least-privilege credentials.

### First deployment validation checklist
1. Run CI on main and ensure it succeeds.
2. Confirm Deploy Azure workflow starts automatically after CI success.
3. Check Azure Login (OIDC) step succeeds.
4. Check app settings steps succeed for both API and web staging slots.
5. Check EF migration step succeeds.
6. Check both smoke tests pass:
  - API health on staging
  - Web root on staging
7. Check slot swaps succeed for API and web.
8. Confirm production endpoints respond after swap.

### Common deployment failures and fixes

#### Azure login fails with OIDC/federation error
Symptoms:
- azure/login step fails before any deployment step runs.

Fix:
- Verify AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID are correct.
- Verify federated credential issuer and branch subject are configured for main.
- Wait for RBAC/federation propagation and rerun.

#### Resource group or app not found
Symptoms:
- az webapp commands fail with not found errors.

Fix:
- Confirm AZURE_RESOURCE_GROUP secret value.
- Confirm app names and slot names match workflow expectations exactly.

#### App settings step fails
Symptoms:
- az webapp config appsettings set returns authorization or validation errors.

Fix:
- Ensure the GitHub OIDC principal has permission to update app settings.
- Verify all referenced secrets exist and are non-empty.

#### EF migration fails
Symptoms:
- dotnet ef database update fails in deploy workflow.

Fix:
- Verify API_CONNECTION_STRING is valid and reachable from GitHub-hosted runners.
- Verify database firewall/network rules allow migration traffic.
- Verify the target database user has schema migration permissions.

#### Smoke test fails after deploy to staging
Symptoms:
- curl checks fail for API /health or web root URL.

Fix:
- Check application startup logs in App Service for staging slot.
- Verify app settings values required at startup were applied correctly.
- Verify slot has the expected runtime stack and startup command.

## Common Issues

### Invalid redirect URI
Symptoms:
- Provider rejects callback after login.

Fix:
- Verify exact callback URL in provider configuration matches local URL and route.

### Invalid client secret
Symptoms:
- Login fails with provider credential errors.

Fix:
- Regenerate secret and update .env.local.
- Ensure you copied secret Value, not secret identifier.

### Missing AUTH_SECRET
Symptoms:
- Session/cookie errors from NextAuth.

Fix:
- Generate AUTH_SECRET and restart web server.

### Microsoft sign-in succeeds, then app still fails
Symptoms:
- You are redirected back into sign-in, or the dashboard says setup is not complete.

Fix:
- Verify AZURE_AD_TENANT_ID matches the app registration supported account types.
- If using a single-tenant app, set AZURE_AD_TENANT_ID to your Directory (tenant) ID.
- If using personal Microsoft accounts, ensure the app registration allows them and set AZURE_AD_TENANT_ID=common.

## Security Practices
- Never commit .env.local.
- Rotate secrets immediately if leaked.
- Use separate app registrations and secrets for dev and production.
- Use least privilege and expiration on secrets where possible.
