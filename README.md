# AI Content Hub

**Bring Your Own Key (BYOK) Social Media Automation SaaS** — generate platform-native copy, AI visuals with brand watermarks, and schedule campaigns from one workspace. You connect your own OpenAI, Anthropic, and Google API keys, so the platform host carries **zero AI token overhead**. Subscriptions unlock premium workflow features, not token resale.

Production: deploy via **Docker** + **Coolify** with live Stripe webhooks at `/api/webhooks/stripe`.

---

## Concept: BYOK infrastructure

AI Content Hub is designed as a **workflow layer** on top of your existing AI accounts:

- **You pay providers directly** for model usage (OpenAI, Anthropic, Google).
- **We charge for SaaS features** — multi-platform generation, planner, watermark controls, multi-brand workspaces, and subscription lifecycle tooling.
- **Keys are encrypted at rest** with `ENCRYPTION_SECRET` before storage in PostgreSQL.

This model keeps margins predictable for operators and gives creators full control over model spend.

---

## Features

### Automated cross-platform expansion

Generate tailored copy for **Instagram**, **Twitter/X**, **LinkedIn**, **TikTok**, **Facebook**, and **YouTube** from a single idea. Pro and Agency tiers unlock all platforms simultaneously.

### Dynamic video / Reels scripting

Short-form modules produce Reels/TikTok storyboards with ready-to-record voiceover-style scripts structured for vertical video workflows.

### Automated logo watermark stamping

Upload a brand mark and apply it to AI-generated images with coordinate-based placement presets (Free: default corner; Pro/Agency: all corners + center).

### Editorial calendar & planner

Interactive visual editorial calendar and planner to easily view, orchestrate, and schedule future posts across platforms.

### Multi-brand dashboard switches (Agency)

Manage up to ten client brand profiles, switch context instantly, and keep generation prompts aligned per company.

### Google Native GSI authentication

Official **Google Identity Services** — One Tap on the landing page and secure popup sign-in for the unified **Get Started** button, integrated with NextAuth.js.

### Flexible plan changes (upgrade / downgrade / billing cycle)

Paid subscribers can change plans from **Settings → Subscription & Billing Plan** or via `POST /api/checkout`:

| Current state | Available actions |
| --- | --- |
| **FREE** | New Stripe Checkout session |
| **Active paid** | `stripe.subscriptions.update` with automatic Stripe proration (tier moves Pro ↔ Agency, Monthly ↔ Annual) |

Stripe computes proration credits/charges instantly when switching tiers or billing intervals mid-cycle.

### Abuse-protected fair refund matrix

In-app cancellation via `/api/checkout/cancel` applies transparent proration:

| Billing | Policy |
| --- | --- |
| **Monthly** | Cancel via Stripe with standard proration (`prorate: true`). |
| **Annual early cancel** | Days used are charged at the **full monthly daily rate** (not the discounted annual rate). Remaining balance is refunded instantly to the card. |

Annual plans include **two months free** (Pro $190/yr, Agency $490/yr).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Actions, dynamic routes) |
| UI | React 19, Tailwind CSS v4, light/dark design tokens |
| Database | PostgreSQL + Prisma ORM 6 |
| Auth | NextAuth.js v4 + Google GSI One Tap / popup |
| Billing | Stripe Checkout, Customer Portal, signed webhooks, fair-refund cancel API |
| AI | BYOK — OpenAI, Anthropic, Google Gemini / Imagen / DALL-E |
| Deploy | Docker multi-stage image, Coolify |

---

## Environment configuration

```bash
cp .env.example .env
```

### Required variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `ENCRYPTION_SECRET` | Encrypts stored AI provider API keys |
| `NEXTAUTH_SECRET` | Session signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public app URL, **no trailing slash** |
| `GOOGLE_CLIENT_ID` | Google OAuth / GSI client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID — Pro **monthly** (`price_1Tg6InLspVzuaPQe2kBB7Cv4`) |
| `STRIPE_PRICE_ID_AGENCY` | Stripe Price ID — Agency **monthly** (`price_1Tg6KFLspVzuaPQeng2CTi50`) |
| `STRIPE_PRICE_ID_PRO_ANNUAL` | Stripe Price ID — Pro **annual** ($190/yr) |
| `STRIPE_PRICE_ID_AGENCY_ANNUAL` | Stripe Price ID — Agency **annual** ($490/yr) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

### Optional

| Variable | Description |
| --- | --- |
| `NEXTAUTH_DEBUG` | `"true"` for verbose NextAuth logs |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Server Actions encryption key |

---

## Setup & installation

### Prerequisites

- Node.js ≥ 22.13
- PostgreSQL
- Google Cloud OAuth Web client
- Stripe account with monthly + annual prices
- At least one AI provider API key

### Local development

```bash
npm install
npx prisma migrate dev   # or: npm run db:push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Google One Tap appears for signed-out visitors.

### Google OAuth / GSI

**Authorized JavaScript origins:** `http://localhost:3000`  
**Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Recommended events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`.

Enable the **Stripe Customer Portal** in Dashboard → Billing → Customer portal.

---

## Production deployment (Docker / Coolify)

Build from the included `Dockerfile`. Container startup runs migrations then Next.js:

```bash
npm start   # prisma migrate deploy && next start
```

### Production checklist

Set all required env vars above. Register live webhook:

```
https://your-domain.com/api/webhooks/stripe
```

### Admin access

The owner email `o0dr.orc0o@gmail.com` is auto-promoted to **ADMIN** on sign-in. The `/admin` route and `/api/admin/users` API are protected — non-admins are redirected to `/dashboard`.

---

## Subscription lifecycle

| Endpoint | Purpose |
| --- | --- |
| `POST /api/checkout` | New checkout (FREE) or in-place plan/cycle change (paid, prorated) |
| `POST /api/checkout/sync` | Sync plan after redirect |
| `POST /api/checkout/restore` | Restore plan from Stripe customer |
| `POST /api/checkout/portal` | Open Stripe billing portal |
| `POST /api/checkout/cancel` | Cancel + fair prorated refund |
| `POST /api/webhooks/stripe` | Webhook-driven plan sync |

Settings → **Subscription & Billing Plan** shows tier, billing cycle, activation/renewal dates, contextual upgrade/downgrade/cycle buttons, and instant cancel/refund.

---

## Project structure

```
src/
├── app/api/checkout/          # checkout, cancel, portal, sync, restore
├── app/api/webhooks/stripe/   # subscription webhooks
├── components/marketing/      # landing, pricing FAQ, GSI
├── components/settings/       # SubscriptionBillingCard
├── lib/billing-refund.ts      # fair refund math
├── lib/subscription-sync.ts   # Stripe ↔ Prisma sync
└── lib/auth.ts                # NextAuth + owner admin promotion
prisma/schema.prisma           # UserSettings billing fields
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Prisma generate + production build |
| `npm start` | Migrate + start production |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:push` | Push schema without migration files |
| `npm run lint` | ESLint |

---

## License

Private project.
