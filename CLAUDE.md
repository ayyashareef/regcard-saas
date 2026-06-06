# RegCard SaaS — Agent Context

## What this is
A multi-tenant SaaS for hotel guest registration. Any hotel can sign up, get their own workspace, and manage reg-cards, rooms, users, and stay extensions. Each tenant has its own logo, brand colors, and card prefix.

Original single-tenant app (`ayyashareef/regcard`) converted to SaaS. Pushed to `github.com/ayyashareef/regcard-saas` (`main`).

---

## Tech Stack
- **Next.js 16** — App Router, Server Actions, Server Components
- **Prisma + SQLite** (local dev) — Postgres-portable schema, only `provider` + `DATABASE_URL` change for prod
- **NextAuth v5** — JWT strategy, edge-safe config split (`lib/auth.config.ts` / `lib/auth.ts`)
- **Tailwind CSS** — dense "Operator Console" design system, all tokens in `app/globals.css`
- **sharp** — logo upload normalization (raster only; SVG intentionally excluded)
- **jsPDF** — registration card PDF generation
- **Dev server port: 3001** (port 3000 is taken by another project on this machine)

---

## Multi-Tenancy Architecture

### Path-based routing — NOT a physical `app/[org]` segment
- Canonical URLs: `/<slug>/dashboard`, `/<slug>/reg-cards`, etc.
- `middleware.ts` validates the slug prefix and **rewrites** to the real unprefixed route, passing the slug via `x-org-slug` header
- Bare links (`/reg-cards`) self-heal: authenticated users are redirected to `/<their-slug>/reg-cards`
- A logged-in user hitting another org's slug is immediately redirected to their own dashboard

### The scoping key is `session.user.orgId` — not the URL
- `orgId` comes from the signed JWT (set at login, cannot be spoofed by URL manipulation)
- **Every server action MUST call `requireTenant()` first** and scope all DB queries by the returned `orgId`
- Never scope by `x-org-slug` or URL params in actions — only the JWT

### Reserved slug: `_platform`
- Platform admins live in the `_platform` org
- `/platform` route branch is gated to `role === "PLATFORM_ADMIN"` in middleware
- Use `requirePlatformAdmin()` in platform actions

---

## Key Files

```
lib/
  tenant.ts          — requireTenant(), requireOrg(), requireOrgRole(), requirePlatformAdmin()
  auth.ts            — NextAuth Node instance (Credentials provider, org-scoped login)
  auth.config.ts     — Edge-safe NextAuth config (no Prisma; JWT/session callbacks)
  enums.ts           — All enum values as typed const unions (Role, OrgStatus, IdType, etc.)
  branding.ts        — brandCssVars(), shade(), readableOn() — CSS var derivation
  slug.ts            — slugify(), validateSlug(), RESERVED_SLUGS, APP_ROUTES
  org-path.ts        — orgPath(slug, path) helper
  actions/
    reg-cards.ts     — CRUD for reg cards; generateCardNo() is org-scoped
    rooms.ts         — Room CRUD
    users.ts         — User CRUD
    extension-requests.ts — Extension review
    branding.ts      — updateBranding(), uploadBrandingLogo(), removeBrandingLogo()
    platform.ts      — listOrganizations(), setOrgStatus() (PLATFORM_ADMIN only)
    signup.ts        — signupOrganization() — creates org + first SUPER_ADMIN

components/v2/
  sidebar.tsx        — Dense sidebar with org logo, nav, user chip
  topbar.tsx         — Breadcrumbs, command bar, live clock
  app-shell.tsx      — CSS grid shell (.app/.main/.scroll)
  page-header.tsx    — .ph design (eyebrow, title, subtitle, actions)
  dashboard/dense-dashboard.tsx — Full dashboard component
  reg-cards/reg-cards-view.tsx
  rooms/rooms-view.tsx
  users/users-view.tsx
  extensions/extensions-view.tsx
  audit/audit-view.tsx

app/
  (dashboard)/layout.tsx  — OrgProvider + brandCssVars() CSS vars injection
  (auth)/login/           — Org-scoped login (reads slug from URL)
  signup/                 — Self-serve org signup
  (platform)/platform/    — Platform admin console
  api/
    branding/[slug]/logo/ — Public logo endpoint (no auth; logos aren't sensitive)
    uploads/[...path]/    — Authenticated file serving (org-isolated)
    reg-cards/[id]/pdf/   — PDF generation
    cron/archive-audit-logs/ — Audit log archival (CRON_SECRET header)
    mobile/**             — All return 503 (DEFERRED)
```

---

## Enums Pattern (important)
SQLite doesn't support Prisma enums. All enums are `String` in the schema.
- **Single source of truth**: `lib/enums.ts` — typed const unions
- **Never import enum types from `@prisma/client`** — import from `@/lib/enums`
- Zod validators use `z.enum([...])` with values from `lib/enums.ts`
- Schema is Postgres-portable: only `provider` in `schema.prisma` changes for prod

---

## Branding System
- Org stores: `primaryColor`, `accentColor`, `sidebarColor` (hex strings), `logoPath`, `cardNoPrefix`
- `lib/branding.ts` → `brandCssVars()` derives all `--color-brand*` + `--color-sidebar*` CSS vars
- Shell wraps content in `<div style={cssVars}>` — no global stylesheet mutation
- Logo upload: PNG/JPEG/WebP only. **SVG intentionally excluded** (XSS risk — SVG can embed scripts)
- All uploads go through `sharp` re-encode to normalize and strip metadata

---

## Design System
Dense "Operator Console" design. All tokens and component classes in `app/globals.css`:
- `.btn` (+ `.primary`, `.ghost`, `.sm`, `.lg`)
- `.panel`, `.panel-h`, `.panel-h-l`, `.panel-h-t`, `.panel-h-m`
- `.tbl`, `.tbl-name-cell`, `.tbl-name`, `.tbl-sub`, `.tbl-action`, `.tbl-cc-flag`
- `.tag`, `.tag-green`, `.tag-amber`, `.tag-rose`, `.tag-sky`, `.tag-violet`, `.tag-grey`
- `.page`, `.ph`, `.ph-eyebrow`, `.ph-h`, `.ph-actions`
- `.stat`, `.seg`, `.search`, `.empty-state`, `.avt`, `.ddot`, `.mono`, `.subtle`, `.muted`
- Sidebar: `.side-*` vars driven by `--color-sidebar*` CSS vars from org branding
- Fonts: Inter (`--font-inter`), Inter Tight (`--font-inter-tight`), JetBrains Mono (`--font-mono-jetbrains`)

Use `useOrgPath()` from `components/org-context.tsx` for all internal links inside the dashboard.

---

## Dev Environment
```bash
cd regcard
npx next dev --webpack -p 3001   # Turbopack sometimes has issues; --webpack is stable
```
- `DATABASE_URL=file:./dev.db` (SQLite)
- `AUTH_URL=http://localhost:3001`
- Seed: `npx prisma db seed` — creates `_platform` org (PLATFORM_ADMIN) + `unima` org (SUPER_ADMIN/MANAGER/STAFF + 10 rooms)
- After schema changes: `npx prisma migrate dev --name <description>`

---

## Deferred / Disabled
- **Mobile API** (`app/api/mobile/**`): All routes return 503. `lib/mobile-auth.ts` is a stub that throws. Do NOT re-enable without implementing org-scoped mobile login (token must embed `orgId`).
- **Billing/Stripe**: Not planned for v1.
- **Postgres**: Local dev uses SQLite. Production cutover documented in `DEPLOY.md`.

---

## Security Rules (follow these always)
1. **Every server action must call `requireTenant()` first** — never trust URL params for org scoping
2. **Every DB query in an action must filter by `orgId`** from `requireTenant()` — no global queries
3. **Path traversal guard**: when serving files, always use `path.resolve()` + verify result starts with the upload root + `path.sep`
4. **Never allow SVG uploads** — stored XSS via `image/svg+xml`
5. **Never install a package published less than 14 days ago** — supply chain attacks target brand-new packages
6. Do not expose Prisma errors or stack traces in API responses — log server-side, return generic messages to the client

---

## Adding a New Feature — Checklist
- [ ] Call `requireTenant()` at the top of every server action
- [ ] Scope every Prisma query with `where: { orgId }` (or nested via relation)
- [ ] Import enum values from `@/lib/enums`, not `@prisma/client`
- [ ] Use `useOrgPath()` for all dashboard links (not hardcoded `/<slug>/...`)
- [ ] Use design classes (`.btn`, `.panel`, `.tbl`, `.tag`, `.page`) — no one-off inline styles for layout
- [ ] Write an `AuditLog` entry for any data-mutating action
- [ ] After adding a DB column, run `npx prisma migrate dev --name <description>`
