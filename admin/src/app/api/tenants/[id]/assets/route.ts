import { NextRequest, NextResponse } from "next/server";
import { adminPb } from "@/lib/pocketbase/admin-client";
import { getServerSession } from "@/lib/auth-pb/server";

interface UploadRecord {
  id: string;
  tenant_id: string;
  category: string;
  file: string;
  created: string;
  uploaded_by?: string;
}

interface AssetView {
  name: string;
  path: string;
  url: string;
  category: string;
  size: number;
  createdAt: string;
}

type RouteContext = { params: Promise<{ id: string }> };

const PB_URL =
  process.env.POCKETBASE_ADMIN_URL ?? "https://mbg-pb-admin.fly.dev";

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: tenantId } = await context.params;

    const pb = await adminPb();
    const result = await pb.list<UploadRecord>("uploads", {
      filter: `tenant_id = "${tenantId.replace(/"/g, '\\"')}"`,
      sort: "-created",
      perPage: 200,
    });

    const assets: AssetView[] = result.items.map((rec) => ({
      name: rec.file,
      path: `${rec.tenant_id}/${rec.category}/${rec.file}`,
      url: `${PB_URL}/api/files/uploads/${rec.id}/${rec.file}`,
      category: rec.category,
      size: 0, // PB doesn't expose file size in record metadata; populated only on upload
      createdAt: rec.created,
    }));

    return NextResponse.json(assets);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: tenantId } = await context.params;
    const { path } = (await request.json()) as { path?: string };

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Missing 'path' in request body" },
        { status: 400 },
      );
    }
    if (!path.startsWith(`${tenantId}/`)) {
      return NextResponse.json(
        { error: "Path does not belong to this tenant" },
        { status: 403 },
      );
    }

    // Path format: <tenant_id>/<category>/<file_name>
    const parts = path.split("/");
    if (parts.length < 3) {
      return NextResponse.json(
        { error: "Malformed path" },
        { status: 400 },
      );
    }
    const fileName = parts[parts.length - 1];

    const pb = await adminPb();
    const result = await pb.list<UploadRecord>("uploads", {
      filter: `tenant_id = "${tenantId.replace(/"/g, '\\"')}" && file = "${fileName.replace(/"/g, '\\"')}"`,
      perPage: 1,
    });
    const record = result.items[0];
    if (!record) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await pb.remove("uploads", record.id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
