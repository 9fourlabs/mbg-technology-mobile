import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useMyBookings, type Booking } from "../../hooks/booking/useMyBookings";
import { useCancelBooking } from "../../hooks/booking/useCancelBooking";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";

type Props = {
  theme: Theme;
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function statusColor(status: string): string {
  switch (status) {
    case "confirmed":
      return "#16a34a";
    case "cancelled":
      return "#dc2626";
    case "completed":
      return "#6b7280";
    default:
      return "#f59e0b";
  }
}

export function MyBookingsScreen({ theme }: Props) {
  const { upcoming, past, loading, error, refetch } = useMyBookings();
  const { cancel, loading: cancelling } = useCancelBooking();

  const handleCancel = (booking: Booking) => {
    Alert.alert(
      "Cancel Booking",
      `Are you sure you want to cancel your ${booking.service_name} appointment?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: async () => {
            const success = await cancel(booking.id);
            if (success) refetch();
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: "#dc2626" }}>{error}</Text>
      </View>
    );
  }

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        subtitle="Book a service to see your appointments here"
        theme={theme}
      />
    );
  }

  const renderBooking = (item: Booking, showCancel: boolean) => (
    <View
      style={[styles.card, { borderColor: theme.mutedText + "30" }]}
      key={item.id}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.serviceName, { color: theme.text }]}>
          {item.service_name}
        </Text>
        <Badge
          label={item.status}
          color={statusColor(item.status)}
          theme={theme}
        />
      </View>
      <Text style={[styles.dateTime, { color: theme.mutedText }]}>
        {formatDate(item.date)} at {formatTime(item.start_time)} -{" "}
        {formatTime(item.end_time)}
      </Text>
      {showCancel ? (
        <Pressable
          style={({ pressed }) => [
            styles.cancelButton,
            { opacity: pressed || cancelling ? 0.5 : 1 },
          ]}
          onPress={() => handleCancel(item)}
          disabled={cancelling}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={[...upcoming, ...past]}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const isUpcoming = upcoming.some((u) => u.id === item.id);
        return renderBooking(item, isUpcoming);
      }}
      ListHeaderComponent={
        upcoming.length > 0 ? (
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Upcoming
          </Text>
        ) : null
      }
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => {
        // Insert "Past" header between sections
        return null;
      }}
      ListFooterComponent={
        past.length > 0 ? (
          <View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Past
            </Text>
            {past.map((b) => renderBooking(b, false))}
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  dateTime: {
    fontSize: 13,
    marginBottom: 4,
  },
  cancelButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  cancelText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "500",
  },
});
