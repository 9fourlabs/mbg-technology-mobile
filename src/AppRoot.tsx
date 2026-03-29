import { useMemo } from "react";
import Constants from "expo-constants";
import { getTemplate } from "./templates";
import TemplateApp from "./TemplateApp";
import AuthenticatedTemplateApp from "./AuthenticatedTemplateApp";
import BookingTemplateApp from "./BookingTemplateApp";
import CommerceTemplateApp from "./CommerceTemplateApp";
import LoyaltyTemplateApp from "./LoyaltyTemplateApp";
import ContentTemplateApp from "./ContentTemplateApp";
import FormsTemplateApp from "./FormsTemplateApp";
import DirectoryTemplateApp from "./DirectoryTemplateApp";

export default function AppRoot() {
  const tenant = String((Constants.expoConfig?.extra as any)?.tenant ?? "mbg");
  const template = useMemo(() => getTemplate(tenant), [tenant]);

  switch (template.templateId) {
    case "booking":
      return <BookingTemplateApp config={template} />;
    case "commerce":
      return <CommerceTemplateApp config={template} />;
    case "loyalty":
      return <LoyaltyTemplateApp template={template} />;
    case "content":
      return <ContentTemplateApp template={template} />;
    case "forms":
      return <FormsTemplateApp template={template} />;
    case "directory":
      return <DirectoryTemplateApp template={template} />;
    case "authenticated":
      return <AuthenticatedTemplateApp template={template} />;
    default:
      return <TemplateApp />;
  }
}
