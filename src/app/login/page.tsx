import { Suspense } from "react";
import { LoginCard } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 text-center text-sm text-zinc-400">
            Loading sign-in...
          </div>
        }
      >
        <LoginCard />
      </Suspense>
    </div>
  );
}
