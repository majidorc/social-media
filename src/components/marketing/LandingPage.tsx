import { Suspense } from "react";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { APP_NAME } from "@/lib/constants";
import {
  CalendarDays,
  Check,
  ImageIcon,
  KeyRound,
  Layers,
  Share2,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";

interface LandingPageProps {
  authConfigured: boolean;
}

const FEATURE_CARDS = [
  {
    icon: Share2,
    title: "Multi-Platform Content",
    description:
      "Generate Instagram captions, Twitter posts, LinkedIn copy, and Reels/TikTok scripts in one click.",
  },
  {
    icon: ImageIcon,
    title: "AI Image Generation",
    description:
      "Create on-brand visuals with DALL-E or Imagen, then overlay your logo with precise watermark placement.",
  },
  {
    icon: CalendarDays,
    title: "Editorial Calendar",
    description:
      "Schedule posts on a visual content planner and manage your publishing timeline from one dashboard.",
  },
  {
    icon: KeyRound,
    title: "Bring Your Own Key",
    description:
      "Connect OpenAI, Anthropic, and Google API keys for full control — or use premium hosted generation later.",
  },
];

export function LandingPage({ authConfigured }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{APP_NAME}</p>
              <p className="text-xs text-muted">AI social content studio</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-muted sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-violet-400"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-accent-soft px-4 py-1.5 text-xs font-medium text-accent-text">
              <Wand2 className="h-3.5 w-3.5" />
              Built for creators, marketers, and agencies
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Ship social content{" "}
              <span className="bg-gradient-to-r from-violet-500 to-violet-300 bg-clip-text text-transparent">
                10× faster
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
              Turn one idea into platform-ready copy, AI visuals with brand watermarks,
              and a scheduled editorial calendar — all from a single workspace.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <Suspense
                fallback={
                  <div className="h-12 w-full max-w-sm animate-pulse rounded-xl bg-card-muted" />
                }
              >
                <GetStartedButton
                  authConfigured={authConfigured}
                  size="large"
                  className="mx-auto"
                />
              </Suspense>
              <p className="text-xs text-muted">
                Google sign-in only · No credit card required on Free
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-border bg-card/80 p-5 shadow-sm transition hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-text transition group-hover:bg-violet-600/20">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="border-y border-border bg-card-muted/40 px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium text-accent-text">Pricing</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Simple plans that scale with you
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
                Start free with your own API keys. Upgrade when you need multi-platform
                output, planner access, or multi-brand workflows.
              </p>
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {PLAN_DEFINITIONS.map((plan) => (
                <article
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${
                    plan.highlighted
                      ? "border-violet-500/40 bg-gradient-to-b from-accent-soft/80 to-card shadow-xl shadow-violet-500/10"
                      : "border-border bg-card"
                  }`}
                >
                  {plan.highlighted ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </div>
                  ) : null}

                  <div className="mb-5">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-accent-text" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {plan.name}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        {plan.priceLabel}
                      </span>
                      <span className="pb-1 text-sm text-muted">{plan.priceSubtext}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted">{plan.description}</p>
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400"
                        : "border border-border bg-card-muted text-foreground hover:bg-card"
                    }`}
                  >
                    {plan.id === "FREE" ? "Start free" : `Choose ${plan.name}`}
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-accent-soft via-card to-card px-6 py-10 text-center sm:px-10 sm:py-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to create your next campaign?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Sign in with Google, connect your API keys, and generate your first
              multi-platform post in minutes.
            </p>
            <div className="mt-6 flex justify-center">
              <Suspense
                fallback={
                  <div className="h-12 w-full max-w-sm animate-pulse rounded-xl bg-card-muted" />
                }
              >
                <GetStartedButton authConfigured={authConfigured} size="large" />
              </Suspense>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-muted sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p>Secure Google OAuth · Bring your own AI keys</p>
        </div>
      </footer>
    </div>
  );
}
