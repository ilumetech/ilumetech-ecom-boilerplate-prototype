# IlumeTech Ecommerce Boilerplate — CLAUDE.md

# This is the root CLAUDE.md for all IlumeTech ecommerce client projects.
# Subdirectory CLAUDE.md files exist at /apps/storefront, /apps/admin, and /apps/api
# for app-specific rules.

## Project Overview
IlumeTech builds ecommerce systems for Indonesian SMBs.
Each client project is an isolated monorepo. One repo = one client.
No shared codebase across clients at runtime — only the boilerplate template is shared.

The system has three apps:
- storefront: public-facing ecommerce site (product catalog, cart, checkout)
- admin: internal management dashboard (orders, inventory, CMS, shipping)
- api: single NestJS backend serving both storefront and admin

## Deployment Model
One deployment per client. Each client has their own:
- Git repo (cloned from this boilerplate)
- Clerk app (no organizations needed)
- Neon database
- Vercel deployment (storefront + admin)
- Railway deployment (api)

## Stack (locked — do not deviate)
Storefront  Next.js (App Router) → deployed on Vercel
Admin       Next.js (App Router) → deployed on Vercel
Backend     NestJS with Fastify adapter → deployed on Railway
Database    PostgreSQL via Prisma ORM → hosted on Neon
Auth        Clerk — authentication and session management only
RBAC        Custom — roles and permissions stored in Prisma DB
Monorepo    Turborepo + pnpm workspaces
Language    TypeScript only. No plain JS files.

## Code Rules
See .claude/rules/ for detailed coding standards.
All rules in .claude/rules/ are mandatory — Claude must follow them on every file touched.
- Package manager: pnpm only. Never use npm or yarn.

## Multi-tenancy
Each client has a completely isolated database on Neon.
There is NO shared database across clients.
Do NOT add orgId/tenantId scoping to queries — isolation is at the DB level.

## Code Style
- English only: variable names, function names, comments, commit messages
- ESLint + Prettier enforced via Husky pre-commit hook
- No raw SQL — Prisma only
- No any types — use proper TypeScript types or unknown
- DTOs for all API inputs using class-validator decorators
- All API responses use a consistent shape: { data, meta?, error? }

## Folder Structure
apps/
  storefront/   Next.js public ecommerce site (see /apps/storefront/CLAUDE.md)
  admin/        Next.js internal dashboard (see /apps/admin/CLAUDE.md)
  api/          NestJS backend (see /apps/api/CLAUDE.md)
packages/
  types/        Shared TypeScript interfaces and enums
  utils/        Shared utility functions
  prisma/       Shared Prisma schema and migrations

## NestJS Conventions
- One module per domain (e.g. ProductModule, OrderModule, ShipmentModule)
- Guards handle auth: ClerkAuthGuard (JWT verify) + PermissionsGuard (queries Prisma for permissions)
- Never skip guards on protected routes
- Use Fastify adapter — do not switch to Express
- Pagination/filter/sort via QueryDto with class-validator on every list endpoint

## Next.js Conventions
- App Router only — no Pages Router
- Server components by default, client components only when needed
- API calls go through a typed service layer, never raw fetch in components
- No direct DB calls from frontend — always go through the NestJS API

## Prisma Conventions
- Schema lives in packages/prisma/schema.prisma
- Run migrations after every schema change
- Never modify schema without running migration immediately after
- Seed files live in packages/prisma/seed.ts

## Auth Architecture
- Admin/staff users → Clerk (synced to User model in Postgres via webhook)
- Storefront customers → Clerk (synced to Customer model in Postgres via webhook)
- User and Customer are separate models — never mix them
- Clerk handles session and JWT — RBAC and permissions are handled by Prisma

## What Claude should always ask before doing
- Installing a new pnpm dependency not already in package.json
- Changing the folder structure defined above
- Changing auth or RBAC logic
- Modifying Prisma schema
- Changing the API response shape
- Adding a new environment variable

## Environment Variables
- .env files are gitignored — never commit secrets
- .env.example must be updated whenever a new env var is added
- Required vars documented in /apps/api/.env.example, /apps/admin/.env.example, /apps/storefront/.env.example

## Out of Scope for This Boilerplate
- Do not add payment gateway integrations unless explicitly scoped
- Do not add real-time features (WebSockets) without confirming deployment supports it
- Do not add multi-vendor marketplace features unless explicitly scoped