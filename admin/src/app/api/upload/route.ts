import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-pb/server";
import { PB_ADMIN_EMAIL } from "@/lib/pocketbase/constants";

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_CATEGORIES = [
  "logo",
  "card",
  "product",
  "post",
  "directory",
  "app-icon",
  "splash",
  "hero",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Upload an image asset to Pocketbase's `uploads` collection.
 * Returns a public URL that the mobile app + admin UI can fetch.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pbUrl = process.env.POCKETBASE_ADMIN_URL;
  const pbPassword = process.env.PB_ADMIN_PASSWORD;
  if (!pbUrl || !pbPassword) {
    return NextResponse.json(
      { error: "PB admin credentials not configured" },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tenantId = formData.get("tenantId") as string | null;
    const category = formData.get("category") as string | null;

    if (!file || !tenantId || !category) {
      return NextResponse.json(
        { error: "Missing required fields: file, tenantId, category" },
        { status: 400 },
      );
    }
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(", ")}`,
        },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only PNG, JPG, GIF, WebP, and SVG are allowed.",
        },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      );
    }

    // Get a fresh PB admin token (uploads collection has no public createRule;
    // service-role-equivalent admin token is required).
    const authRes = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: PB_ADMIN_EMAIL,
        password: pbPassword,
      }),
    });
    if (!authRes.ok) {
      return NextResponse.json(
        { error: "PB admin auth failed" },
        { status: 500 },
      );
    }
    const { token } = (await authRes.json()) as { token: string };

    // Sanitize filename for the PB record (PB preserves the original name
    // but strips weird chars).
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ts = Date.now();
    const renamed = new File([file], `${ts}-${safeName}`, { type: file.type });

    const pbForm = new FormData();
    pbForm.set("tenant_id", tenantId);
    pbForm.set("category", category);
    pbForm.set("file", renamed);
    pbForm.set("uploaded_by", session.user.email);

    const createRes = await fetch(
      `${pbUrl}/api/collections/uploads/records`,
      {
        method: "POST",
        headers: { Authorization: token },
        body: pbForm,
      },
    );
    if (!createRes.ok) {
      const body = await createRes.text();
      return NextResponse.json(
        { error: `Upload failed: ${body}` },
        { status: 500 },
      );
    }
    const record = (await createRes.json()) as {
      id: string;
      file: string;
      tenant_id: string;
      category: string;
    };

    // Public URL for the uploaded file. PB serves these from
    // /api/files/<collection>/<recordId>/<filename>.
    const url = `${pbUrl}/api/files/uploads/${record.id}/${record.file}`;

    return NextResponse.json({
      url,
      path: `${record.tenant_id}/${record.category}/${record.file}`,
      record_id: record.id,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
