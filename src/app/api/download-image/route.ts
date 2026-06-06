import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";

export async function GET(request: Request) {
  try {
    await requireCurrentUser();

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing image URL." }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Unsupported image URL." }, { status: 400 });
    }

    const upstream = await fetch(parsed.toString());
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Could not fetch image." },
        { status: upstream.status },
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/download-image]", error);
    return NextResponse.json({ error: "Failed to download image." }, { status: 500 });
  }
}
