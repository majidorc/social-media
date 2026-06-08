"use client";

import { CheckoutError, startCheckout } from "@/lib/start-checkout";
import { cn } from "@/lib/utils";
import type { CheckoutPlanType, MarketingBillingInterval } from "@/types";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface CheckoutButtonProps {
  planType: CheckoutPlanType;
  billingInterval?: MarketingBillingInterval;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function CheckoutButton({
  planType,
  billingInterval = "MONTHLY",
  children,
  className,
  disabled = false,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await startCheckout(planType, billingInterval);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof CheckoutError
          ? checkoutError.message
          : "Could not start checkout. Try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-red-700 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
