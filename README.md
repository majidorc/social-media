# AI Content Hub

**Bring Your Own Key (BYOK) Social Media Automation SaaS** — generate platform-native copy, AI visuals with brand watermarks, and schedule campaigns from one workspace. Sign in with **Google Native GSI (One Tap + Popup)**, connect your own OpenAI / Anthropic / Google keys, and upgrade through **Stripe** when you need Pro or Agency capabilities.

Production deployment: [https://aisocial.majidorc.com](https://aisocial.majidorc.com) (Coolify + Docker).

---

## Features

### Content generation & distribution

- **Multi-platform campaign output** — one idea becomes tailored copy for **Instagram**, **Twitter/X**, **LinkedIn**, **TikTok**, **Facebook**, and **YouTube** in a single generation run.
- **Reels / TikTok storyboarding** — short-form scripts with ready-to-record voiceover-style copy structured for vertical video workflows.
- **AI image generation** — optional **DALL-E 3** or **Google Imagen** visuals alongside text, with per-run model overrides.
- **Token usage & cost tracking** — provider usage metadata stored per workspace for transparency.

### Branding & creative control

- **Automated logo watermarking** — upload a brand mark and apply it to generated images.
- **Watermark position presets** — Free tier uses bottom-right default; Pro/Agency unlock all corner and center placements.
- **Brand profile context** — company name, description, website, and social handle feed into generation prompts.

### Planning & workflow

- **Visual editorial calendar** — drag-and-drop content planner (Pro/Agency) to schedule posts and manage publishing timelines.
- **Generation history** — sidebar recall of recent workspaces; retention gated by plan (3 days Free, unlimited paid).
- **Multi-brand client switching** — Agency tier supports multiple brand profiles and fast context switching for client work.

### Authentication & billing

- **Google Native GSI OAuth** — official Identity Services **One Tap** on the landing page and **popup sign-in** for the unified **Get Started** CTA, backed by **NextAuth.js**.
- **Stripe subscriptions** — Pro ($19/mo) and Agency ($49/mo) checkout, webhook-driven plan sync, billing portal for invoices / payment methods / cancellation, and subscription restore from Settings.
- **Feature gating** — platform count, planner access, watermark positions, brand profile limits, and history retention enforced server-side.

### Admin

- **Admin panel** — manage users and plans (owner email auto-promoted to ADMIN).

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 15** (App Router, Server Actions, dynamic routes, middleware) |
| UI | **React 19**, **Tailwind CSS v4**, light/dark theme tokens |
| Database | **PostgreSQL** + **Prisma ORM 6** |
| Auth | **NextAuth.js v4** (Google provider, JWT sessions, Prisma adapter) |
| Billing | **Stripe** Checkout, Billing Portal, signed webhooks |
| AI | OpenAI, Anthropic, Google Gemini / Imagen (BYOK) |
| Deploy | **Docker** multi-stage image, **Coolify** |

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/     # NextAuth handlers
│   │   ├── auth/google/code/       # GSI popup code exchange
│   │   ├── checkout/               # Stripe checkout, portal, sync, restore
│   │   ├── webhooks/stripe/        # Subscription lifecycle webhooks
│   │   ├── generate/               # AI content + image generation
│   │   ├── planner/                # Scheduled posts API
│   │   └── settings/               # API keys, watermark, brand profiles
│   ├── dashboard/                  # Content generator workspace
│   ├── planner/                    # Editorial calendar
│   ├── settings/                   # BYOK keys, billing, brand context
│   ├── admin/                      # User administration
│   └── page.tsx                    # Marketing landing + pricing
├── components/
│   ├── auth/                       # GoogleIdentityProvider, login UI
│   ├── settings/                   # SettingsForm, SubscriptionBillingCard
│   └── subscription/               # Plan badges, checkout buttons
├── lib/
│   ├── ai/                         # Providers, prompts, cost calculator
│   ├── actions/                    # Server actions (settings, planner)
│   ├── subscription-sync.ts        # Stripe → Prisma plan sync
│   └── auth.ts                     # NextAuth configuration
prisma/
├── schema.prisma                   # User, UserSettings, BrandProfile, workspaces
└── migrations/
Dockerfile                          # Production container
```

---

## Environment configuration

Copy the example file and fill in values:

```bash
cp .env.example .env
```

### Required variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `ENCRYPTION_SECRET` | Encrypts stored AI provider API keys at rest |
| `NEXTAUTH_SECRET` | Session signing secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public app URL, **no trailing slash** (e.g. `https://aisocial.majidorc.com`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Web client ID (also used for GSI One Tap / popup) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_PRICE_ID_PRO` | Stripe Price ID for the Pro monthly plan |
| `STRIPE_PRICE_ID_AGENCY` | Stripe Price ID for the Agency monthly plan |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from the Stripe webhook endpoint |

### Optional variables

| Variable | Description |
| --- | --- |
| `NEXTAUTH_DEBUG` | Set to `"true"` for verbose NextAuth server logs |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Stabilizes Server Action encryption if added later |

---

## Setup & installation

### Prerequisites

- **Node.js** ≥ 22.13
- **PostgreSQL** database
- **Google Cloud** OAuth Web application credentials
- **Stripe** account with Products/Prices for Pro and Agency tiers
- At least one AI provider API key for generation (OpenAI, Anthropic, or Google)

### Local development

```bash
npm install
npx prisma db push    # sync schema to local database
# or: npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors see the landing page with Google One Tap; protected routes redirect to `/?callbackUrl=...`.

### Google OAuth & GSI (local)

In [Google Cloud Console](https://console.cloud.google.com/) → **Credentials** → OAuth Web client:

**Authorized JavaScript origins**

```
http://localhost:3000
```

**Authorized redirect URIs**

```
http://localhost:3000/api/auth/callback/google
```

Set in `.env`:

```bash
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Stripe (local)

1. Create **Pro** and **Agency** recurring prices in Stripe Dashboard.
2. Add price IDs to `.env` as `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_AGENCY`.
3. Forward webhooks to your local app (Stripe CLI example):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

**Enable the Stripe Customer Portal** in Dashboard → Settings → Billing → Customer portal (required for “Manage or Cancel Subscription” in Settings).

Recommended webhook events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

---

## Production deployment (Docker / Coolify)

The repository ships a multi-stage **Dockerfile**. Coolify (or any Docker host) should build from the Dockerfile and expose port **3000**.

Container startup:

```bash
npm start   # runs: prisma migrate deploy && next start
```

### Production checklist

```bash
DATABASE_URL=postgresql://...
ENCRYPTION_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_AGENCY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

### Google OAuth (production)

**Authorized JavaScript origins**

```
https://your-domain.com
```

**Authorized redirect URIs**

```
https://your-domain.com/api/auth/callback/google
```

> Do **not** add a trailing slash to `NEXTAUTH_URL`. Values like `https://example.com/` can cause Google `redirect_uri_mismatch` errors.

### Stripe webhook (production)

Register a live webhook endpoint pointing to:

```
https://your-domain.com/api/webhooks/stripe
```

Use the signing secret as `STRIPE_WEBHOOK_SECRET`. After deploy, run a test checkout and confirm the user’s plan updates in Settings → **Subscription & Billing**.

Billing portal return URL is configured in code as `{NEXTAUTH_URL}/settings`.

---

## Subscription plans

| Plan | Price | Highlights |
| --- | --- | --- |
| **Free** | $0 | Single platform, default watermark, 3-day history, BYOK |
| **Pro** | $19/mo | All platforms, planner, custom watermark positions, unlimited history |
| **Agency** | $49/mo | Everything in Pro + multi-brand profiles (up to 10) |

Upgrade from the landing page **#pricing** section or Settings → **Upgrade Plan**. Paid users manage billing through **Manage or Cancel Subscription** (Stripe Customer Portal).

---

## Usage workflow

1. **Get Started** on the homepage — Google One Tap or popup sign-in.
2. **Settings** — add encrypted API keys, set default model, configure brand profile and watermark.
3. **Subscription & Billing** — view plan tier, renewal date, upgrade, or open Stripe portal.
4. **Dashboard** — enter an idea, optional image, select platforms, generate copy (+ optional AI image).
5. **Planner** (Pro/Agency) — schedule generated content on the editorial calendar.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | `prisma generate` + production Next.js build |
| `npm start` | Apply migrations + start production server |
| `npm run db:migrate` | Create/apply Prisma migrations (dev) |
| `npm run db:push` | Push schema to database without migration files |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |

---

## Security notes

- API keys are encrypted with `ENCRYPTION_SECRET` before persistence.
- Sessions use HTTP-only cookies; middleware protects dashboard, planner, settings, admin, and billing API routes.
- Stripe webhooks are verified with `STRIPE_WEBHOOK_SECRET` before mutating subscription state.
- Google GSI popup codes are exchanged server-side; ID tokens are validated through NextAuth.

---

## License

Private project.
