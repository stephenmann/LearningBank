# Learning Bank Documentation Index

This directory contains implementation-focused component documentation.

## Component Guides
- Environment setup: [environment-setup.md](environment-setup.md)
- API: [api.md](api.md)
- Domain: [domain.md](domain.md)
- Infrastructure: [infrastructure.md](infrastructure.md)
- Web: [web.md](web.md)

## Deployment Infrastructure
- Azure Bicep templates are in infra/azure.
- Deployment workflows apply infra/azure/main.bicep before application deployment.

## Suggested Reading Order
1. domain.md
2. infrastructure.md
3. api.md
4. web.md

## Why this order
- Domain defines core rules and contracts.
- Infrastructure implements domain persistence contracts.
- API orchestrates auth, validation, and use cases.
- Web consumes API behavior and renders user experiences.
