import { useMemo } from "react";
import Constants from "expo-constants";
import { getTemplate } from "./templates";
import TemplateApp from "./TemplateApp";
import AuthenticatedTemplateApp from "./AuthenticatedTemplateApp";

export default function AppRoot() {
  const tenant = String((Constants.expoConfig?.extra as any)?.tenant ?? "mbg");
  const template = useMemo(() => getTemplate(tenant), [tenant]);

  if (template.templateId === "authenticated") {
    return <AuthenticatedTemplateApp template={template} />;
  }

  // Informational (default)
  return <TemplateApp />;
}
