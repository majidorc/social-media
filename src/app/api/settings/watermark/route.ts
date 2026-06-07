import { NextResponse } from "next/server";
import {
  removeWatermarkLogo,
  saveWatermarkLogo,
} from "@/lib/actions/settings";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const logo = formData.get("logo");

    if (!(logo instanceof File)) {
      return NextResponse.json(
        { error: "Upload a PNG logo file." },
        { status: 400 },
      );
    }

    if (logo.type && logo.type !== "image/png") {
      return NextResponse.json(
        { error: "Upload a transparent PNG logo." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await logo.arrayBuffer());
    const result = await saveWatermarkLogo(buffer);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/settings/watermark]", error);
    return NextResponse.json(
      { error: "Failed to save brand logo." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const result = await removeWatermarkLogo();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[DELETE /api/settings/watermark]", error);
    return NextResponse.json(
      { error: "Failed to remove brand logo." },
      { status: 500 },
    );
  }
}
