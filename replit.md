# Vortex Hosting

A Minecraft server hosting panel with a branded landing page, email login via Clerk, a React-based control panel, Express API, Discord bot, and 4-tier pricing.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk auth (`@clerk/express`)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (`@clerk/react` + `@clerk/themes`) — keys auto-provisioned
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Java 21 (via Nix `jdk21`) — for actual Minecraft server processes

## Where things live

- `artifacts/panel/src/App.tsx` — Clerk provider, routing, auth gates
- `artifacts/panel/src/pages/landing.tsx` — public marketing/landing page
- `artifacts/panel/src/components/layout.tsx` — authenticated sidebar with user info + sign-out
- `artifacts/panel/public/clerk/` — locally bundled Clerk JS (no CDN needed)
- `artifacts/panel/public/clerk-ui/` — locally bundled Clerk UI components
- `artifacts/api-server/src/app.ts` — Express app with Clerk proxy + middleware
- `artifacts/api-server/src/middlewares/requireAuth.ts` — auth guard middleware
- `artifacts/api-server/src/routes/` — API routes (servers protected by requireAuth)

## Architecture decisions

- Clerk JS and UI are served from local public files (`/clerk/` and `/clerk-ui/`) instead of from Clerk's CDN. This is required because Clerk dev mode uses `clerk.localhost` which doesn't resolve in hosted environments like Replit preview or any browser that's not running locally.
- Owner email `thethe231hgf@outlook.com` is detected client-side via `useIsOwner()` hook and shown a Crown badge + "All plans free" label. Backend `requireAuth` middleware uses Clerk's `getAuth()`.
- All `/api/servers/*` routes are protected by `requireAuth` middleware.
- The landing page is always visible to unauthenticated users at `/`. Signed-in users are redirected to `/dashboard`.

## Product

- **Landing page** (`/`): Marketing page with hero, features, pricing preview, CTAs
- **Sign In / Sign Up** (`/sign-in`, `/sign-up`): Clerk-powered email auth with Vortex Hosting branding
- **Dashboard** (`/dashboard`): Lists all active Minecraft servers
- **Deploy Server** (`/servers/new`): Create a new Minecraft server (choose plan, software, version)
- **Server Detail** (`/servers/:id`): Live console, start/stop, metrics
- **Plans** (`/plans`): 4 tiers — Free ($0), Starter ($3), Pro ($10), Enterprise ($25)
- **Owner account** (`thethe231hgf@outlook.com`): Crown badge, "All plans free" label

## User preferences

- Owner email: `thethe231hgf@outlook.com` — gets enterprise access + owner UI treatment
- All text must say "Servers" not "Nodes" throughout the UI
- Branding: "Vortex Hosting" (not "Vortex Ops")
- Do NOT use `<UserButton />` — use `useUser()` and custom sign-out button

## Gotchas

- Clerk dev keys (`pk_test_*`) use `clerk.localhost` FAPI. Clerk JS/UI are served from `public/clerk/` and `public/clerk-ui/` locally to avoid CDN failures.
- If Clerk packages are upgraded, re-copy the dist files: `cp node_modules/@clerk/clerk-js/dist/*clerk.browser*.js artifacts/panel/public/clerk/` and `cp node_modules/@clerk/ui/dist/ui.browser.js artifacts/panel/public/clerk-ui/`
- Never use `console.log` in server code — use `req.log` or the `logger` singleton.
- `pnpm --filter @workspace/db run push` must be run to apply schema changes in dev.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
