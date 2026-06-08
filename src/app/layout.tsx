import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { GoogleIdentityRootProvider } from "@/components/providers/GoogleIdentityRootProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { getGoogleClientId, isAuthConfigured } from "@/lib/auth-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Content Hub",
  description:
    "Multi-platform AI content creation dashboard for social media teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <GoogleIdentityRootProvider
              clientId={getGoogleClientId()}
              authConfigured={isAuthConfigured()}
            >
              {children}
            </GoogleIdentityRootProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
