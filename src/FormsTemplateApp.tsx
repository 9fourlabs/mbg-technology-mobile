import React, { useState } from "react";
import BaseAuthenticatedApp, { type Theme } from "./BaseAuthenticatedApp";
import { FormListScreen } from "./screens/forms/FormListScreen";
import { FormScreen } from "./screens/forms/FormScreen";
import { SubmissionsScreen } from "./screens/forms/SubmissionsScreen";
import type { FormsTemplate } from "./templates/types";

type Props = {
  template: FormsTemplate;
};

export default function FormsTemplateApp({ template }: Props) {
  return (
    <BaseAuthenticatedApp
      brand={template.brand}
      auth={template.auth}
      tabs={template.tabs}
      protectedTabs={template.protectedTabs}
      renderTab={(tabId, theme, navigation) =>
        renderFormsTab(tabId, theme, navigation, template)
      }
    />
  );
}

function renderFormsTab(
  tabId: string,
  theme: Theme,
  _navigation: any,
  template: FormsTemplate
): React.ReactNode | null {
  switch (tabId) {
    case "forms":
      return <FormsStack config={template.forms} theme={theme} />;
    case "submissions":
      return <SubmissionsScreen theme={theme} />;
    default:
      return null;
  }
}

/**
 * Local stack for forms: list -> individual form.
 * Uses simple state instead of a nested navigator to stay lightweight.
 */
function FormsStack({
  config,
  theme,
}: {
  config: FormsTemplate["forms"];
  theme: Theme;
}) {
  const [activeFormId, setActiveFormId] = useState<string | null>(null);

  const activeDef = activeFormId
    ? config.forms.find((f) => f.id === activeFormId) ?? null
    : null;

  if (activeDef) {
    return (
      <FormScreen
        formDef={activeDef}
        theme={theme}
        onSuccess={() => setActiveFormId(null)}
      />
    );
  }

  return (
    <FormListScreen
      config={config}
      theme={theme}
      onFormPress={(formId) => setActiveFormId(formId)}
    />
  );
}
