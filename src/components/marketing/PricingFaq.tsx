"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  highlighted?: boolean;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: "byok",
    question: "Why do I still need my own API keys?",
    answer:
      "AI Content Hub is a BYOK (Bring Your Own Key) platform. You connect your OpenAI, Anthropic, or Google credentials so generation runs on your accounts — we never resell tokens. Your subscription unlocks premium workflow features such as multi-platform output, the editorial planner, watermark controls, and multi-brand workspaces.",
  },
  {
    id: "fair-refund",
    question: "Fair Refund Policy",
    highlighted: true,
    answer:
      "We value flexibility. If an annual subscriber cancels early, unused time is refunded immediately to the original payment method. Days already used are recalculated at the standard, non-discounted monthly tier rate ($19/mo for Pro, $49/mo for Agency) — not the discounted annual daily rate — and the remaining balance is returned to your card. Monthly subscribers receive a fair prorated refund using the same transparent daily rate.",
  },
  {
    id: "annual-savings",
    question: "How does annual billing work?",
    answer:
      "Annual plans include two months free compared with paying monthly for twelve months (Pro: $190/year instead of $228; Agency: $490/year instead of $588). You keep every premium feature for the full term, and our fair refund policy protects you if your needs change mid-cycle.",
  },
  {
    id: "cancel-anytime",
    question: "Can I cancel anytime?",
    answer:
      "Yes. Paid users can cancel from Settings and receive an instant prorated refund where applicable. Your workspace returns to the Free tier immediately after cancellation, and your encrypted API keys remain saved for future use.",
  },
  {
    id: "payment-security",
    question: "How are payments handled?",
    answer:
      "All card data is processed securely by Stripe. We never store raw payment details on our servers. Invoices, payment method updates, and subscription receipts are available through your billing history.",
  },
];

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-colors",
        item.highlighted
          ? "border-violet-500/35 bg-gradient-to-br from-accent-soft/50 to-card"
          : "border-border",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground sm:text-base">
            {item.question}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0 text-muted transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="border-t border-border px-4 pb-4 pt-3 text-sm leading-relaxed text-muted sm:px-5">
            {item.answer}
          </p>
        </div>
      </div>
    </article>
  );
}

export function PricingFaq() {
  return (
    <div className="mt-14 border-t border-border pt-12">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-accent-text">FAQ</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Billing questions, answered clearly
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Transparent policies so you always know what you are paying for and how
          refunds are calculated.
        </p>
      </div>
      <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-3">
        {FAQ_ITEMS.map((item) => (
          <FaqAccordionItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
