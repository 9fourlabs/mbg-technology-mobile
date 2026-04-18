import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDefaultConfig, configToTypeScript } from "@/lib/config-generator";
import { commitTenantConfig, createTenantPullRequest } from "@/lib/github";
import type { TemplateId } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Parse body
    const body = await request.json();
    const {
      tenant_id,
      template_type,
      business_name,
      brand,
      app_type = "template",
      repo_url,
      repo_branch = "main",
      brief,
    } = body as {
      tenant_id: string;
      template_type?: TemplateId;
      business_name: string;
      brand?: {
        primaryColor: string;
        backgroundColor: string;
        textColor: string;
        logoUrl: string;
      };
      app_type?: "template" | "custom";
      repo_url?: string;
      repo_branch?: string;
      brief?: {
        industry?: string;
        primaryContactName?: string;
        primaryContactEmail?: string;
        primaryGoal?: string;
        specialRequirements?: string;
        targetLaunchDate?: string;
      };
    };

    const briefRecord = brief && typeof brief === "object" ? brief : {};

    if (!tenant_id || !business_name) {
      return NextResponse.json(
        { error: "Missing required fields: tenant_id, business_name" },
        { status: 400 },
      );
    }

    // Custom app path — just insert the record, no config generation or PR
    if (app_type === "custom") {
      if (!repo_url) {
        return NextResponse.json(
          { error: "Custom apps require a repo_url" },
          { status: 400 },
        );
      }

      const { error: insertError } = await supabase.from("tenants").insert({
        id: tenant_id,
        business_name,
        template_type: "custom",
        status: "draft",
        config: {},
        app_type: "custom",
        repo_url,
        repo_branch,
        brief: briefRecord,
      });

      if (insertError) {
        const isDupe = insertError.code === "23505" || insertError.message?.includes("duplicate");
        return NextResponse.json(
          { error: isDupe ? "A tenant with this ID already exists. Choose a different ID." : insertError.message },
          { status: isDupe ? 409 : 400 },
        );
      }

      return NextResponse.json({
        success: true,
        tenant_id,
      });
    }

    // Template app path — existing behavior
    if (!template_type) {
      return NextResponse.json(
        { error: "Template apps require template_type" },
        { status: 400 },
      );
    }

    // Generate the full default config for this template type
    const config = generateDefaultConfig(template_type);

    // Merge brand colors from the request into the default config
    if (brand) {
      if (brand.primaryColor) config.brand.primaryColor = brand.primaryColor;
      if (brand.backgroundColor) config.brand.backgroundColor = brand.backgroundColor;
      if (brand.textColor) config.brand.textColor = brand.textColor;
      if (brand.logoUrl) config.brand.logoUri = brand.logoUrl;
    }

    // Insert tenant into Supabase
    const { error: insertError } = await supabase.from("tenants").insert({
      id: tenant_id,
      business_name,
      template_type,
      status: "draft",
      config,
      app_type: "template",
      brief: briefRecord,
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 },
      );
    }

    // Generate TypeScript and JSON config files
    const tsContent = configToTypeScript(tenant_id, config);
    const jsonContent = JSON.stringify(config, null, 2);

    // Commit files to a new branch
    const { branch } = await commitTenantConfig(tenant_id, tsContent, jsonContent);

    // Open a pull request
    const pr = await createTenantPullRequest(branch, tenant_id, template_type);

    return NextResponse.json({
      success: true,
      tenant_id,
      pr_url: pr.url,
      pr_number: pr.number,
    });
  } catch (err) {
    console.error("Failed to create tenant:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
