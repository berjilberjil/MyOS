# MyOS — Personal Life Operating System

Private, daily-driver "operating system for my life": finance, journal, health, fitness, to-dos, goals, notes, and a mindmap dashboard that visualizes how everything connects. Single-user, privacy-first.

Owner: **Berjil** — personal project. Commit + push as `berjilberjil <berjiljacob@gmail.com>`, GitHub `berjilberjil/MyOS` via the `github-personal` SSH remote (`git@github-personal:berjilberjil/MyOS.git`). **Never** commit as the work/`@skcript.com` identity here.

## Reference (read-only)
`/Users/berjilskcript/Documents/monorepo` ("Knol", SvelteKit) is a **read-only reference** for theme/color/animation tokens and the content-studio interaction flow. **Never modify it.** Design tokens were ported into `src/routes/layout.css`.

## Stack
SvelteKit 2 + Svelte 5 (runes) · Tailwind v4 (CSS-first, `@theme inline` in `src/routes/layout.css`, no `tailwind.config.js`) · shadcn-svelte "luma" + Bits UI · TipTap · TanStack Svelte Query · Supabase (Postgres + Auth + Storage) · Dexie (offline) · `@vite-pwa/sveltekit`. Runtime: **Bun**. Dev port **5177**.

## Run
```bash
bunx supabase start      # local backend (Docker)
bun run dev              # http://localhost:5177
```
Local dev owner (placeholder — change before real use): `owner@myos.local` / `ChangeMe!myos1`.

## Test / verify
```bash
bun run test -- --run    # Vitest unit suite
bun run check            # svelte-check (must be 0 errors)
bunx playwright test     # e2e (builds + previews on :4173)
# RLS integration tests (needs local stack). Signup is disabled, so the tests
# create users via the admin/service_role API — both keys required:
export SUPABASE_ANON_KEY="$(bunx supabase status -o env | grep '^ANON_KEY=' | cut -d'\"' -f2)"
export SUPABASE_SERVICE_ROLE_KEY="$(bunx supabase status -o env | grep '^SERVICE_ROLE_KEY=' | cut -d'\"' -f2)"
bun run test -- --run tests/unit/rls.test.ts tests/unit/finance-rls.test.ts
```

## Conventions
- **Money is integer paise** everywhere (`src/lib/money.ts`). Never store float money.
- **Privacy:** single owner. Public signup disabled. RLS `user_id = auth.uid()` on every table. Private media buckets, signed URLs only. Add RLS + a policy test for every new table.
- **Data access** via `src/lib/data/repository.ts` (`Repository<T>` / `SupabaseRepository`) and `storage-service.ts`; offline writes go through `sync-queue.ts`.
- **Components:** shadcn-svelte luma in `src/lib/components/ui` (`import * as Card from '$lib/components/ui/card'`). 13px-base compact UI. Three themes: light / dark / Tokyo Night (`tui`).
- **TDD**, frequent commits, conventional-commit messages.

## Status & roadmap
Specs + plans in `docs/superpowers/`. Build order (each module = own brainstorm → spec → plan → build):

1. ✅ **Phase 0 — Foundation** (DONE: scaffold, themes, primitives, app shell, Supabase+auth+RLS, data layer, offline sync, PWA)
2. ✅ **Phase 1 — Finance (MVP)** (DONE: accounts, transactions, 3-second quick-add, categories+budgets, recurring/salary/subscriptions with on-open catch-up, savings goals, investments/SIPs, dashboard. Money in `src/lib/finance/` — pure calc + reconcile; charts in `src/lib/components/charts/`.)
3. ⬜ **Phase 2 — Journal (media)** ← next. · 4. To-dos + Goals · 5. Health + Fitness · 6. Notes · 7. Mindmap life-dashboard (last — visualizes the rest via the `links` table).

To continue: pick the next module (Phase 2 — Journal), then brainstorm → spec → plan → build. Phase 1 artifacts: `docs/superpowers/specs/2026-06-26-phase1-finance-design.md` + `docs/superpowers/plans/2026-06-26-phase1-finance.md`.
