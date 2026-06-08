import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const codeSchema = z.object({
  code: z.string().min(1),
});

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const parsed = codeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid authorization code payload." },
        { status: 400 },
      );
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: parsed.data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "postmessage",
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenResponse.json()) as {
      id_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenResponse.ok || !tokens.id_token) {
      console.error("[POST /api/auth/google/code] Token exchange failed:", tokens);
      return NextResponse.json(
        {
          error:
            tokens.error_description ??
            tokens.error ??
            "Failed to exchange Google authorization code.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ idToken: tokens.id_token });
  } catch (error) {
    console.error("[POST /api/auth/google/code]", error);
    return NextResponse.json(
      { error: "Failed to complete Google sign-in." },
      { status: 500 },
    );
  }
}
