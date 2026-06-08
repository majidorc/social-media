"use client";

import {
  completeGoogleCredentialSignIn,
  completeGooglePopupSignIn,
  normalizeAuthCallbackUrl,
} from "@/lib/google-auth-client";
import type { GoogleCredentialResponse } from "@/types/google-identity-services";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

interface GoogleIdentityContextValue {
  signInWithGoogle: () => void;
  authConfigured: boolean;
  isSigningIn: boolean;
  signInError: string | null;
}

const GoogleIdentityContext = createContext<GoogleIdentityContextValue | null>(
  null,
);

export function useGoogleIdentity(): GoogleIdentityContextValue {
  const context = useContext(GoogleIdentityContext);

  if (!context) {
    throw new Error("useGoogleIdentity must be used within GoogleIdentityProvider.");
  }

  return context;
}

interface GoogleIdentityProviderProps {
  children: ReactNode;
  clientId: string;
  authConfigured: boolean;
  enableOneTap?: boolean;
}

function GoogleIdentityProviderInner({
  children,
  clientId,
  authConfigured,
  enableOneTap = true,
}: GoogleIdentityProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const callbackUrl = normalizeAuthCallbackUrl(searchParams.get("callbackUrl"));

  const [gsiReady, setGsiReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  const codeClientRef = useRef<{ requestCode: () => void } | null>(null);
  const initializedRef = useRef(false);

  const finishSignIn = useCallback(
    async (credential: string) => {
      setIsSigningIn(true);
      setSignInError(null);

      try {
        const result = await completeGoogleCredentialSignIn(credential, callbackUrl);

        if (!result.ok) {
          setSignInError(result.error ?? "Google sign-in failed.");
          return;
        }

        router.push(callbackUrl);
        router.refresh();
      } finally {
        setIsSigningIn(false);
      }
    },
    [callbackUrl, router],
  );

  const handleCredentialResponse = useCallback(
    (response: GoogleCredentialResponse) => {
      if (response.credential) {
        void finishSignIn(response.credential);
      }
    },
    [finishSignIn],
  );

  const initializeGsi = useCallback(() => {
    if (
      !authConfigured ||
      !clientId ||
      !window.google?.accounts ||
      initializedRef.current
    ) {
      return;
    }

    initializedRef.current = true;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
    });

    codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: "openid email profile",
      ux_mode: "popup",
      callback: (response) => {
        if (!response.code) {
          return;
        }

        setIsSigningIn(true);
        setSignInError(null);

        void completeGooglePopupSignIn(response.code, callbackUrl)
          .then((result) => {
            if (!result.ok) {
              setSignInError(result.error ?? "Google sign-in failed.");
              return;
            }

            router.push(callbackUrl);
            router.refresh();
          })
          .finally(() => {
            setIsSigningIn(false);
          });
      },
      error_callback: (error) => {
        if (error.type !== "popup_closed") {
          setSignInError(error.message ?? "Google sign-in was interrupted.");
        }
      },
    });
  }, [authConfigured, callbackUrl, clientId, handleCredentialResponse, router]);

  useEffect(() => {
    if (gsiReady) {
      initializeGsi();
    }
  }, [gsiReady, initializeGsi]);

  useEffect(() => {
    if (
      !gsiReady ||
      !authConfigured ||
      !enableOneTap ||
      status !== "unauthenticated" ||
      !window.google?.accounts?.id
    ) {
      return;
    }

    window.google.accounts.id.prompt();
  }, [gsiReady, authConfigured, enableOneTap, status]);

  const signInWithGoogle = useCallback(() => {
    if (!authConfigured) {
      setSignInError("Google sign-in is not configured on the server.");
      return;
    }

    if (!codeClientRef.current) {
      initializeGsi();
    }

    setSignInError(null);
    codeClientRef.current?.requestCode();
  }, [authConfigured, initializeGsi]);

  return (
    <GoogleIdentityContext.Provider
      value={{
        signInWithGoogle,
        authConfigured,
        isSigningIn,
        signInError,
      }}
    >
      {authConfigured && clientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setGsiReady(true)}
        />
      ) : null}
      {children}
    </GoogleIdentityContext.Provider>
  );
}

export function GoogleIdentityProvider(props: GoogleIdentityProviderProps) {
  return (
    <Suspense fallback={props.children}>
      <GoogleIdentityProviderInner {...props} />
    </Suspense>
  );
}
