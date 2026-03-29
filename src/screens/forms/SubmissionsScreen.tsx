import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useSubmissions } from "../../hooks/forms/useSubmissions";

type Props = {
  theme: Theme;
};

const STATUS_COLORS: Record<string, string> = {
  submitted: "#3182ce",
  reviewed: "#d69e2e",
  approved: "#38a169",
  rejected: "#e53e3e",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SubmissionsScreen({ theme }: Props) {
  const { data, loading, error, refetch } = useSubmissions();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: "#e53e3e" }]}>{error}</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Submissions Yet</Text>
        <Text style={[styles.emptyBody, { color: theme.mutedText }]}>
          Your submitted forms will appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onRefresh={refetch}
      refreshing={loading}
      renderItem={({ item }) => {
        const badgeColor = STATUS_COLORS[item.status] ?? theme.mutedText;
        return (
          <View style={[styles.submissionItem, { borderColor: theme.primary + "30" }]}>
            <View style={styles.submissionHeader}>
              <Text style={[styles.formId, { color: theme.text }]}>{item.form_id}</Text>
              <View style={[styles.badge, { backgroundColor: badgeColor + "20" }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{item.status}</Text>
              </View>
            </View>
            <Text style={[styles.date, { color: theme.mutedText }]}>{formatDate(item.created_at)}</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  list: {
    padding: 20,
  },
  submissionItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  submissionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  formId: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  date: {
    fontSize: 13,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
  },
});
