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
