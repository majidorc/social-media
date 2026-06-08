export const dynamic = "force-dynamic";

import { LandingPage } from "@/components/marketing/LandingPage";

function isAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET,
  );
}

export default function HomePage() {
  return <LandingPage authConfigured={isAuthConfigured()} />;
}
