# AI Content Hub

Multi-platform AI content studio built with **Next.js 15**, **React 19**, **Prisma**, and **PostgreSQL**. Generate tailored social copy for Instagram, Twitter/X, LinkedIn, TikTok, YouTube, and Facebook — optionally with AI-generated graphics from **Imagen 3** or **DALL-E 3** — in a single run.

Sign in with **Google** only. API keys are stored encrypted per user.

## Features

- **Google OAuth login** — protected dashboard and settings
- **Multi-platform text generation** — one prompt, unique copy per platform
- **Optional image generation** — text model writes an image prompt; Imagen 3 or DALL-E 3 renders the graphic
- **Provider-aware model pickers** — only models for configured API keys appear in dropdowns
- **Encrypted API key storage** — OpenAI, Anthropic, and Google keys saved per account
- **Generation history** — workspaces persisted in PostgreSQL

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Database | PostgreSQL + Prisma 6 |
| Auth | NextAuth.js v4 (Google provider) |
| AI | OpenAI, Anthropic, Google Gemini, Imagen, DALL-E |

## Project structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/   # Google OAuth
│   ├── api/generate/             # Content + image generation
│   ├── api/settings/             # API keys & default model
│   ├── dashboard/                # Content generator
│   ├── login/                    # Google sign-in
│   └── settings/                 # Provider keys & preferences
├── components/                   # UI (dashboard, settings, layout)
├── lib/
│   ├── ai/                       # Models, providers, prompts, orchestration
│   ├── actions/settings.ts       # Server-side settings logic
│   └── auth.ts                   # NextAuth configuration
└── middleware.ts                 # Route protection
prisma/
├── schema.prisma
└── migrations/
```

## Prerequisites

- **Node.js** ≥ 22.13
- **PostgreSQL** database
- **Google Cloud OAuth** client (Web application)
- At least one AI provider API key (OpenAI, Anthropic, or Google) for generation

## Environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ENCRYPTION_SECRET` | Yes | Secret for encrypting stored API keys |
| `NEXTAUTH_SECRET` | Yes | Session signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Public app URL, **no trailing slash** (e.g. `https://aisocial.example.com`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | No | Optional; for future Server Actions |

## Local development

```bash
npm install
npm run db:migrate    # apply Prisma migrations
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

### Google OAuth (local)

In [Google Cloud Console](https://console.cloud.google.com/) → **Credentials** → your OAuth client:

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
```

## Production deployment (Docker / Coolify)

The repo includes a multi-stage `Dockerfile`. Coolify should use **Dockerfile** as the build pack (`coolify.json`).

Startup runs migrations then Next.js:

```bash
npm start   # prisma migrate deploy && next start
```

### Production env checklist

```bash
DATABASE_URL=postgresql://...
ENCRYPTION_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
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

> **Important:** Do not add a trailing slash to `NEXTAUTH_URL`. A value like `https://example.com/` can cause `redirect_uri_mismatch` with Google.

## Usage

1. **Sign in** with Google at `/login`.
2. **Settings** — add OpenAI, Anthropic, and/or Google API keys. Choose a default text model (only providers with keys are listed).
3. **Dashboard** — enter optional idea, media URLs, and target platforms.
4. Optionally select an **image generation model** (Imagen 3 or DALL-E 3) for copy + graphic in one run.
5. Click **Generate** — platform captions and optional image appear in the output panel.

## Supported models

### Text

| Model | Provider |
| --- | --- |
| GPT-4o / GPT-4o Mini | OpenAI |
| Claude Sonnet 4 | Anthropic |
| Gemini 2.5 Pro / Flash | Google |

### Image (optional)

| Model | Provider |
| --- | --- |
| Imagen 3 Pro / Fast | Google |
| DALL-E 3 | OpenAI |

Model IDs and provider mappings live in `src/lib/ai/models.ts`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Migrate DB + start production server |
| `npm run db:migrate` | Create/apply migrations (dev) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | Run ESLint |

## License

Private project.
