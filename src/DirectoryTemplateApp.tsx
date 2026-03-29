import React, { useCallback, useState } from "react";
import BaseAuthenticatedApp, { type Theme } from "./BaseAuthenticatedApp";
import { DirectoryListScreen } from "./screens/directory/DirectoryListScreen";
import { DirectoryDetailScreen } from "./screens/directory/DirectoryDetailScreen";
import type { DirectoryTemplate } from "./templates/types";

type Props = {
  template: DirectoryTemplate;
};

export default function DirectoryTemplateApp({ template }: Props) {
  return (
    <BaseAuthenticatedApp
      brand={template.brand}
      auth={template.auth}
      tabs={template.tabs}
      protectedTabs={template.protectedTabs}
      renderTab={(tabId, theme, _navigation) => {
        if (tabId === "browse") {
          return <BrowseStack config={template.directory} theme={theme} />;
        }
        return null;
      }}
    />
  );
}

/** Local stack for browse list -> detail navigation. */
function BrowseStack({
  config,
  theme,
}: {
  config: DirectoryTemplate["directory"];
  theme: Theme;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleItemPress = useCallback((id: string) => {
    setSelectedItemId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedItemId(null);
  }, []);

  if (selectedItemId) {
    return (
      <DirectoryDetailScreen
        itemId={selectedItemId}
        config={config}
        theme={theme}
        onBack={handleBack}
      />
    );
  }

  return (
    <DirectoryListScreen
      config={config}
      theme={theme}
      onItemPress={handleItemPress}
    />
  );
}
