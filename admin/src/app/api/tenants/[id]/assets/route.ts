import { NextRequest, NextResponse } from "next/server";
import { createSupabaseStorageClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth-pb/server";

const SUPABASE_URL = "https://wmckytfxlcxzhzduttvv.supabase.co";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const supabase = createSupabaseStorageClient();

    const { id: tenantId } = await context.params;

    const { data: files, error } = await supabase.storage
      .from("tenant-assets")
      .list(tenantId, { sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // files at root level are category folders — list each subfolder
    const assets: {
      name: string;
      path: string;
      url: string;
      category: string;
      size: number;
      createdAt: string;
    }[] = [];

    // Each entry could be a folder (category) or a file at root
    const folders = (files ?? []).filter((f) => f.id === null || !f.metadata);
    const rootFiles = (files ?? []).filter((f) => f.id !== null && f.metadata);

    // Add root-level files (no category)
    for (const file of rootFiles) {
      const path = `${tenantId}/${file.name}`;
      assets.push({
        name: file.name,
        path,
        url: `${SUPABASE_URL}/storage/v1/object/public/tenant-assets/${path}`,
        category: "uncategorized",
        size: file.metadata?.size ?? 0,
        createdAt: file.created_at ?? "",
      });
    }

    // List files in each category subfolder
    for (const folder of folders) {
      const category = folder.name;
      const { data: categoryFiles } = await supabase.storage
        .from("tenant-assets")
        .list(`${tenantId}/${category}`, {
          sortBy: { column: "created_at", order: "desc" },
        });

      if (categoryFiles) {
        for (const file of categoryFiles) {
          // Skip folders within category
          if (file.id === null && !file.metadata) continue;
          const path = `${tenantId}/${category}/${file.name}`;
          assets.push({
            name: file.name,
            path,
            url: `${SUPABASE_URL}/storage/v1/object/public/tenant-assets/${path}`,
            category,
            size: file.metadata?.size ?? 0,
            createdAt: file.created_at ?? "",
          });
        }
      }
    }

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
    const supabase = createSupabaseStorageClient();

    // Ensure the path belongs to this tenant
    const { id: tenantId } = await context.params;
    const { path } = await request.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Missing 'path' in request body" },
        { status: 400 }
      );
    }

    if (!path.startsWith(`${tenantId}/`)) {
      return NextResponse.json(
        { error: "Path does not belong to this tenant" },
        { status: 403 }
      );
    }

    const { error } = await supabase.storage
      .from("tenant-assets")
      .remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
