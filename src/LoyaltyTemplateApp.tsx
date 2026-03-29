import React from "react";
import BaseAuthenticatedApp, { type Theme } from "./BaseAuthenticatedApp";
import { LoyaltyDashboardScreen } from "./screens/loyalty/LoyaltyDashboardScreen";
import { RewardsScreen } from "./screens/loyalty/RewardsScreen";
import { TransactionsScreen } from "./screens/loyalty/TransactionsScreen";
import type { LoyaltyTemplate } from "./templates/types";

type Props = {
  template: LoyaltyTemplate;
};

export default function LoyaltyTemplateApp({ template }: Props) {
  return (
    <BaseAuthenticatedApp
      brand={template.brand}
      auth={template.auth}
      tabs={template.tabs}
      protectedTabs={template.protectedTabs}
      renderTab={(tabId, theme, navigation) =>
        renderLoyaltyTab(tabId, theme, navigation, template)
      }
    />
  );
}

function renderLoyaltyTab(
  tabId: string,
  theme: Theme,
  _navigation: any,
  template: LoyaltyTemplate
): React.ReactNode | null {
  switch (tabId) {
    case "card":
      return <LoyaltyDashboardScreen config={template.loyalty} theme={theme} />;
    case "rewards":
      return <RewardsScreen config={template.loyalty} theme={theme} />;
    case "history":
      return <TransactionsScreen theme={theme} />;
    default:
      return null;
  }
}
