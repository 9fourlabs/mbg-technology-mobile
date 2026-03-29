import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import type { BookingConfig } from "../../templates/types";
import { useBookSlot } from "../../hooks/booking/useBookSlot";
import { ThemedButton } from "../../components/ThemedButton";

type Props = {
  serviceId: string;
  slotId: string;
  config: BookingConfig;
  theme: Theme;
  /** Slot metadata passed in for display */
  slotInfo?: {
    date: string;
    startTime: string;
    endTime: string;
  };
  onConfirm: () => void;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export function BookingConfirmScreen({
  serviceId,
  slotId,
  config,
  theme,
  slotInfo,
  onConfirm,
}: Props) {
  const [notes, setNotes] = useState("");
  const { book, loading, error } = useBookSlot();

  const service = config.services.find((s) => s.id === serviceId);

  const handleConfirm = async () => {
    const bookingId = await book(serviceId, slotId, notes || undefined);
    if (bookingId) {
      Alert.alert("Booking Confirmed", "Your appointment has been booked.", [
        { text: "OK", onPress: onConfirm },
      ]);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Confirm Booking
      </Text>

      <View style={[styles.detailCard, { borderColor: theme.mutedText + "30" }]}>
        {service ? (
          <Text style={[styles.serviceName, { color: theme.text }]}>
            {service.name}
          </Text>
        ) : null}

        {slotInfo ? (
          <>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.mutedText }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatDate(slotInfo.date)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.mutedText }]}>
                Time
              </Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {formatTime(slotInfo.startTime)} -{" "}
                {formatTime(slotInfo.endTime)}
              </Text>
            </View>
          </>
        ) : null}

        {service?.duration ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.mutedText }]}>
              Duration
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {service.duration} min
            </Text>
          </View>
        ) : null}

        {service?.price != null ? (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.mutedText }]}>
              Price
            </Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(service.price)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>
        Notes (optional)
      </Text>
      <TextInput
        style={[
          styles.notesInput,
          { color: theme.text, borderColor: theme.mutedText + "40" },
        ]}
        placeholder="Any special requests?"
        placeholderTextColor={theme.mutedText}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {config.cancellationPolicy ? (
        <Text style={[styles.policy, { color: theme.mutedText }]}>
          {config.cancellationPolicy}
        </Text>
      ) : null}

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <ThemedButton
        title="Confirm Booking"
        onPress={handleConfirm}
        loading={loading}
        theme={theme}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
  },
  detailCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 80,
    marginBottom: 16,
  },
  policy: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 12,
  },
});
