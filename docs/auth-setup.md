# Auth Setup Guide

This guide covers local authentication setup for My Learning Bank.

## Files Used
- Web environment template: src/learning-bank-web/.env.example
- Local web environment file (do not commit): src/learning-bank-web/.env.local
- API base config: src/LearningBank.Api/appsettings.json

## Quick Start
1. Copy src/learning-bank-web/.env.example to src/learning-bank-web/.env.local.
2. Fill in all required values from this guide.
3. Start the app with ./dev.ps1.

## Variable Reference

### AUTH_SECRET
Purpose:
- Secret used by NextAuth to sign and encrypt auth/session tokens.

How to generate:
- PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
- OpenSSL: openssl rand -base64 32

Notes:
- Use a unique value per environment.
- Rotate immediately if exposed.

### GOOGLE_CLIENT_ID
Purpose:
- OAuth client identifier for Google sign-in.

How to get it:
1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs and Services, then Credentials.
4. Create OAuth 2.0 Client ID as Web application.
5. Add redirect URI: http://localhost:3000/api/auth/callback/google.
6. Copy the Client ID.

### GOOGLE_CLIENT_SECRET
Purpose:
- OAuth client secret paired with GOOGLE_CLIENT_ID.

How to get it:
- From the same Google OAuth client credential, copy Client Secret.

### AZURE_AD_CLIENT_ID
Purpose:
- Application client ID for Microsoft Entra sign-in.

How to get it:
1. Open Azure Portal.
2. Go to Microsoft Entra ID, then App registrations.
3. Create or select an app registration.
4. Add Web redirect URI: http://localhost:3000/api/auth/callback/microsoft-entra-id.
5. Copy Application client ID.

### AZURE_AD_CLIENT_SECRET
Purpose:
- Client secret for the Microsoft Entra app registration.

How to get it:
1. In the app registration, open Certificates and secrets.
2. Create a new client secret.
3. Copy Secret Value.

### AZURE_AD_TENANT_ID
Purpose:
- Controls which Microsoft Entra tenant issuer NextAuth uses.

Common values:
- common: personal + work or school accounts.
- consumers: personal Microsoft accounts only.
- tenant GUID: single tenant sign-in.

If you see AADSTS9002346, set AZURE_AD_TENANT_ID=consumers and restart the dev server.

### NEXT_PUBLIC_API_URL
Purpose:
- Base URL used by the web app BFF/API client.

Default local value:
- http://localhost:5001/api/v1

### NEXTAUTH_URL
Purpose:
- Public URL where the Next.js app is reachable.

Default local value:
- http://localhost:3000

## Provider Setup Checklists

### Google
- OAuth consent screen configured.
- OAuth web client created.
- Redirect URI set to http://localhost:3000/api/auth/callback/google.

### Microsoft Entra
- App registration created.
- Redirect URI set to http://localhost:3000/api/auth/callback/microsoft-entra-id.
- Client secret value copied.
- Supported account types match AZURE_AD_TENANT_ID.

## Local Verification
1. Run ./dev.ps1.
2. Open http://localhost:3000/sign-in.
3. Test Continue with Google.
4. Test Continue with Microsoft.
5. Confirm API health endpoint responds at http://localhost:5001/health.

## Common Issues

### Invalid redirect URI
- Ensure callback URL in provider exactly matches local callback route.

### Invalid client secret
- Regenerate secret and update .env.local.
- Ensure you copied secret Value, not secret identifier.

### Missing AUTH_SECRET
- Generate AUTH_SECRET and restart web server.

### Microsoft sign-in loops or fails after callback
- Ensure AZURE_AD_TENANT_ID matches app registration account type configuration.

## Security Practices
- Never commit .env.local.
- Rotate secrets if leaked.
- Use separate app registrations and secrets per environment.
- Prefer least privilege and secret expiry policies.
