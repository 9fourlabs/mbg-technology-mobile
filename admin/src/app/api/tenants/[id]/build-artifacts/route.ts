import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth-pb/server";
import { getEASBuilds } from "@/lib/eas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // validate route param exists

    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const builds = await getEASBuilds(10);

    return NextResponse.json({ builds });
  } catch (error) {
    console.error("build-artifacts error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
