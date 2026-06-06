# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-06-06

### Added

- **AI Content Hub** foundation — dashboard, settings, and PostgreSQL schema via Prisma
- **Multi-platform text generation** for Instagram, Twitter/X, LinkedIn, TikTok, YouTube, and Facebook
- **Direct AI provider integration** — OpenAI, Anthropic, and Google Gemini (2.5 Pro / Flash)
- **Encrypted API key storage** per user with masked display in Settings
- **Provider-aware model selection** — dropdowns only show models for configured API keys
- **Multi-modal generation** — optional Imagen 3 (Pro/Fast) or DALL-E 3 image output in the same run as platform copy
- **Google-only authentication** via NextAuth.js with protected routes and sign-out in sidebar
- **Dockerfile** and Coolify configuration for production deploys
- **README** and **CHANGELOG** documentation

### Changed

- Settings saves use `/api/settings` REST endpoints instead of client Server Actions (avoids stale action IDs after deploy)
- Settings UI order: API keys first, then default model (depends on configured providers)
- Home route redirects unauthenticated users to `/login`

### Fixed

- Prisma migrations run on production startup (`prisma migrate deploy`)
- Docker build: install devDependencies for Next.js compile; use `NODE_ENV=production` during build
- Coolify: switched from Nixpacks to Dockerfile for reliable builds
- Google OAuth `redirect_uri_mismatch` when `NEXTAUTH_URL` has a trailing slash
- Default model resolution when stored preference requires an unconfigured provider

### Security

- API keys encrypted at rest with `ENCRYPTION_SECRET`
- Dashboard, settings, and generation APIs require authenticated session
- Middleware returns `401` for unauthenticated API requests

## [0.0.1] - 2026-06-06

### Added

- Initial Next.js 15 project scaffold (`create-next-app`)

[Unreleased]: https://github.com/majidorc/social-media/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/majidorc/social-media/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/majidorc/social-media/releases/tag/v0.0.1
