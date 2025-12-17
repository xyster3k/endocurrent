# EndoCurrent — Endocrinology news & admin tools

Next.js 15 (App Router) deployed to Cloudflare Pages with Clerk auth/billing (Stripe under the hood) and Supabase (Postgres + Storage + RLS). Includes public feed, article detail page, admin/editor shell, AI draft endpoint, AdSense gating, and Supabase schema.

## Running locally

```bash
npm install
npm run dev
```

Environment variables live in `.env.example` (copy to `.env.local`). Minimum:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (for metadata), `NEXT_PUBLIC_ADSENSE_CLIENT` (optional)

## Cloudflare Pages deploy

- Build command: `npm run cf:build` (runs `@cloudflare/next-on-pages`)
- Preview locally (after build): `npm run cf:preview`
- `wrangler.toml` sets `pages_build_output_dir=".vercel/output/static"` and `nodejs_compat`.

## Supabase

- Schema and starter RLS policies: `supabase/schema.sql`
- Generated TS types: `src/db/types.ts`
- Server/client helpers: `src/lib/supabase/*`

## API surface (stubs wired to Supabase with mock fallback)

- Public: `/api/articles`, `/api/articles/:slug`, `/api/articles/:id/like`, `/api/articles/:id/report`
- Admin: `/api/admin/articles`, `/api/admin/articles/:id`, `/api/admin/articles/:id/publish`, `/api/admin/articles/:id/unpublish`, `/api/admin/reports`, `/api/admin/reports/:id/resolve`, `/api/admin/ai-generate-article`
- Billing webhook: `/api/webhooks/clerk-billing`

## UI entry points

- Feed: `src/app/page.tsx`
- Article detail: `src/app/articles/[slug]/page.tsx`
- Admin shell: `src/app/admin/*`
- Shared components: `src/components/*`

AdSense loads in `app/layout.tsx` and is disabled automatically for premium users once subscription state is wired to `shouldShowAds`.


