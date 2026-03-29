import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { LoyaltyConfig } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useAuth } from "../../auth/AuthProvider";
import { useLoyaltyAccount } from "../../hooks/loyalty/useLoyaltyAccount";

type Props = {
  config: LoyaltyConfig;
  theme: Theme;
};

export function LoyaltyDashboardScreen({ config, theme }: Props) {
  const { user } = useAuth();
  const { account, loading, error } = useLoyaltyAccount();

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
        <Text style={{ color: "#e53e3e" }}>{error}</Text>
      </View>
    );
  }

  const currentTier = config.tiers.find((t) => t.name === account?.tier) ?? config.tiers[0];
  const nextTier = config.tiers.find((t) => t.minPoints > (account?.lifetime_points ?? 0));
  const progress = nextTier
    ? Math.min(
        ((account?.lifetime_points ?? 0) - (currentTier?.minPoints ?? 0)) /
          (nextTier.minPoints - (currentTier?.minPoints ?? 0)),
        1
      )
    : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.programName, { color: theme.mutedText }]}>
        {config.programName}
      </Text>

      {/* Points Balance */}
      <View style={[styles.pointsCard, { backgroundColor: theme.primary + "15" }]}>
        <Text style={[styles.pointsLabel, { color: theme.mutedText }]}>Your Points</Text>
        <Text style={[styles.pointsBalance, { color: theme.primary }]}>
          {account?.points_balance?.toLocaleString() ?? "0"}
        </Text>
        <Text style={[styles.lifetimePoints, { color: theme.mutedText }]}>
          {account?.lifetime_points?.toLocaleString() ?? "0"} lifetime points
        </Text>
      </View>

      {/* Tier */}
      <View style={styles.tierSection}>
        <View style={styles.tierHeader}>
          <Text style={[styles.tierLabel, { color: theme.text }]}>
            {currentTier?.name ?? "Member"}
          </Text>
          {nextTier && (
            <Text style={[styles.nextTierLabel, { color: theme.mutedText }]}>
              Next: {nextTier.name}
            </Text>
          )}
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: theme.primary + "20" }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: currentTier?.color ?? theme.primary,
                width: `${Math.round(progress * 100)}%`,
              },
            ]}
          />
        </View>
        {nextTier && (
          <Text style={[styles.progressText, { color: theme.mutedText }]}>
            {nextTier.minPoints - (account?.lifetime_points ?? 0)} points to {nextTier.name}
          </Text>
        )}
      </View>

      {/* QR / ID Code */}
      <View style={styles.qrSection}>
        <Text style={[styles.qrPrompt, { color: theme.mutedText }]}>
          Show this code to earn points
        </Text>
        <View style={styles.qrBox}>
          <Text style={styles.qrText}>{user?.id ?? "---"}</Text>
        </View>
      </View>

      {/* Tier Perks */}
      {currentTier?.perks && currentTier.perks.length > 0 && (
        <View style={styles.perksSection}>
          <Text style={[styles.perksTitle, { color: theme.text }]}>Your Perks</Text>
          {currentTier.perks.map((perk, i) => (
            <Text key={i} style={[styles.perkItem, { color: theme.mutedText }]}>
              {perk}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  programName: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  pointsCard: {
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
  },
  pointsLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  pointsBalance: {
    fontSize: 48,
    fontWeight: "800",
    marginBottom: 4,
  },
  lifetimePoints: {
    fontSize: 13,
  },
  tierSection: {
    marginBottom: 28,
  },
  tierHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tierLabel: {
    fontSize: 17,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  nextTierLabel: {
    fontSize: 13,
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
  },
  qrSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  qrPrompt: {
    fontSize: 14,
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  qrText: {
    fontFamily: "monospace",
    fontSize: 13,
    color: "#111",
    letterSpacing: 0.5,
  },
  perksSection: {
    marginBottom: 20,
  },
  perksTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  perkItem: {
    fontSize: 14,
    lineHeight: 22,
    paddingLeft: 8,
  },
});
