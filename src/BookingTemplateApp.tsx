import React, { useCallback, useState } from "react";
import BaseAuthenticatedApp, { type Theme } from "./BaseAuthenticatedApp";
import type { BookingTemplate } from "./templates/types";
import { BookingHomeScreen } from "./screens/booking/BookingHomeScreen";
import { TimeSlotPickerScreen } from "./screens/booking/TimeSlotPickerScreen";
import { BookingConfirmScreen } from "./screens/booking/BookingConfirmScreen";
import { MyBookingsScreen } from "./screens/booking/MyBookingsScreen";

type BookingStep =
  | { screen: "home" }
  | { screen: "slots"; serviceId: string }
  | {
      screen: "confirm";
      serviceId: string;
      slotId: string;
      slotInfo?: { date: string; startTime: string; endTime: string };
    };

type Props = {
  config: BookingTemplate;
};

export default function BookingTemplateApp({ config }: Props) {
  const [step, setStep] = useState<BookingStep>({ screen: "home" });

  const renderTab = useCallback(
    (tabId: string, theme: Theme, _navigation: any) => {
      if (tabId === "book") {
        switch (step.screen) {
          case "home":
            return (
              <BookingHomeScreen
                config={config.booking}
                theme={theme}
                onBook={(serviceId) =>
                  setStep({ screen: "slots", serviceId })
                }
              />
            );
          case "slots":
            return (
              <TimeSlotPickerScreen
                serviceId={step.serviceId}
                config={config.booking}
                theme={theme}
                onSlotSelected={(slotId) =>
                  setStep({
                    screen: "confirm",
                    serviceId: step.serviceId,
                    slotId,
                  })
                }
              />
            );
          case "confirm":
            return (
              <BookingConfirmScreen
                serviceId={step.serviceId}
                slotId={step.slotId}
                config={config.booking}
                theme={theme}
                slotInfo={step.slotInfo}
                onConfirm={() => setStep({ screen: "home" })}
              />
            );
        }
      }

      if (tabId === "appointments") {
        return <MyBookingsScreen theme={theme} />;
      }

      return null;
    },
    [step, config.booking],
  );

  return (
    <BaseAuthenticatedApp
      brand={config.brand}
      auth={config.auth}
      tabs={config.tabs}
      protectedTabs={config.protectedTabs}
      renderTab={renderTab}
    />
  );
}
