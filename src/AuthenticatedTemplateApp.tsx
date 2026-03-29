import React from "react";
import BaseAuthenticatedApp from "./BaseAuthenticatedApp";
import type { AuthenticatedTemplate } from "./templates/types";

type Props = {
  template: AuthenticatedTemplate;
};

/**
 * Authenticated template — uses BaseAuthenticatedApp with default card rendering.
 * No custom tab content; all tabs render the standard PageHeader + TemplateCard layout.
 */
export default function AuthenticatedTemplateApp({ template }: Props) {
  return (
    <BaseAuthenticatedApp
      brand={template.brand}
      auth={template.auth}
      tabs={template.tabs}
      protectedTabs={template.protectedTabs}
    />
  );
}
