# Environment Setup Guide

This guide has been split into focused documents:

- Authentication setup: [auth-setup.md](auth-setup.md)
- Azure dev deployment setup: [azure-dev-deploy.md](azure-dev-deploy.md)
- Azure prod deployment setup: [azure-prod-deploy.md](azure-prod-deploy.md)

## Which Guide To Use

- Use auth-setup.md when configuring local sign-in providers and web environment values.
- Use azure-dev-deploy.md when setting up direct deployment with .github/workflows/deploy-azure-dev.yaml.
- Use azure-prod-deploy.md when setting up slot-based production deployment with .github/workflows/deploy-azure-prod.yaml.

## Local Quick Start

1. Copy src/learning-bank-web/.env.example to src/learning-bank-web/.env.local.
2. Complete all required values using auth-setup.md.
3. Start the app with ./dev.ps1.
