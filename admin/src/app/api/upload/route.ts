import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_CATEGORIES = ["logo", "card", "product", "post", "directory", "app-icon", "splash", "hero"];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const SUPABASE_URL = "https://wmckytfxlcxzhzduttvv.supabase.co";

export async function POST(request: NextRequest) {
  // Authenticate
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tenantId = formData.get("tenantId") as string | null;
    const category = formData.get("category") as string | null;

    if (!file || !tenantId || !category) {
      return NextResponse.json(
        { error: "Missing required fields: file, tenantId, category" },
        { status: 400 }
      );
    }

    // Validate category
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPG, GIF, WebP, and SVG are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Build storage path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${tenantId}/${category}/${timestamp}-${safeName}`;

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("tenant-assets")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/tenant-assets/${storagePath}`;

    return NextResponse.json({ url, path: storagePath });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
