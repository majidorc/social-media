"use client";

import { GoogleIdentityProvider } from "@/components/auth/GoogleIdentityProvider";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface GoogleIdentityRootProviderProps {
  children: ReactNode;
  clientId: string;
  authConfigured: boolean;
}

export function GoogleIdentityRootProvider({
  children,
  clientId,
  authConfigured,
}: GoogleIdentityRootProviderProps) {
  const pathname = usePathname();
  const enableOneTap = pathname === "/";

  return (
    <GoogleIdentityProvider
      clientId={clientId}
      authConfigured={authConfigured}
      enableOneTap={enableOneTap}
    >
      {children}
    </GoogleIdentityProvider>
  );
}
