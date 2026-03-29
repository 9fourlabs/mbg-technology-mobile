import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import type { BookingConfig } from "../../templates/types";
import { useTimeSlots } from "../../hooks/booking/useTimeSlots";
import { EmptyState } from "../../components/EmptyState";

type Props = {
  serviceId: string;
  config: BookingConfig;
  theme: Theme;
  onSlotSelected: (slotId: string) => void;
};

function formatDateLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";

  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export function TimeSlotPickerScreen({
  serviceId,
  config,
  theme,
  onSlotSelected,
}: Props) {
  const dates = useMemo(() => {
    const result: Date[] = [];
    const now = new Date();
    for (let i = 0; i < config.advanceBookingDays; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, [config.advanceBookingDays]);

  const [selectedDate, setSelectedDate] = useState<Date>(dates[0]);
  const dateStr = toDateString(selectedDate);

  const { data: slots, loading, error } = useTimeSlots(serviceId, dateStr);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Select a Date</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dates.map((d) => {
          const isActive = toDateString(d) === dateStr;
          return (
            <Pressable
              key={toDateString(d)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.background,
                  borderColor: isActive ? theme.primary : theme.mutedText + "40",
                },
              ]}
              onPress={() => setSelectedDate(d)}
            >
              <Text
                style={[
                  styles.dateChipDay,
                  { color: isActive ? "#fff" : theme.mutedText },
                ]}
              >
                {d.toLocaleDateString("en-US", { weekday: "short" })}
              </Text>
              <Text
                style={[
                  styles.dateChipNum,
                  { color: isActive ? "#fff" : theme.text },
                ]}
              >
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.subtitle, { color: theme.text }]}>
        Available Times
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={styles.loader}
        />
      ) : error ? (
        <Text style={[styles.errorText, { color: "#dc2626" }]}>{error}</Text>
      ) : slots.length === 0 ? (
        <EmptyState
          title="No available slots"
          subtitle="Try selecting a different date"
          theme={theme}
        />
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.slotCard,
                {
                  borderColor: theme.mutedText + "30",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => onSlotSelected(item.id)}
            >
              <Text style={[styles.slotTime, { color: theme.text }]}>
                {formatTime(item.start_time)} - {formatTime(item.end_time)}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={styles.slotList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  dateRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dateChip: {
    width: 56,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 2,
  },
  dateChipNum: {
    fontSize: 18,
    fontWeight: "700",
  },
  loader: {
    marginTop: 32,
  },
  errorText: {
    paddingHorizontal: 16,
    marginTop: 16,
    fontSize: 14,
  },
  slotList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  slotCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: "500",
  },
});
