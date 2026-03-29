import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { LoyaltyConfig } from "../../templates/types";
import type { Theme } from "../../BaseAuthenticatedApp";
import { useRewards } from "../../hooks/loyalty/useRewards";
import { useLoyaltyAccount } from "../../hooks/loyalty/useLoyaltyAccount";
import { useRedeemReward } from "../../hooks/loyalty/useRedeemReward";

type Props = {
  config: LoyaltyConfig;
  theme: Theme;
};

export function RewardsScreen({ config, theme }: Props) {
  const { data: rewards, loading: rewardsLoading, refetch: refetchRewards } = useRewards();
  const { account, loading: accountLoading, refetch: refetchAccount } = useLoyaltyAccount();
  const { redeem, loading: redeemLoading } = useRedeemReward();

  const loading = rewardsLoading || accountLoading;
  const balance = account?.points_balance ?? 0;

  async function handleRedeem(rewardId: string, pointsCost: number, name: string) {
    Alert.alert(
      "Redeem Reward",
      `Redeem "${name}" for ${pointsCost.toLocaleString()} points?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            const success = await redeem(rewardId, pointsCost);
            if (success) {
              Alert.alert("Success", `You have redeemed "${name}"!`);
              refetchAccount();
              refetchRewards();
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (rewards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No Rewards Available</Text>
        <Text style={[styles.emptyBody, { color: theme.mutedText }]}>
          Check back soon for new rewards to redeem.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rewards}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={[styles.balanceBanner, { backgroundColor: theme.primary + "15" }]}>
          <Text style={[styles.balanceLabel, { color: theme.mutedText }]}>Your Balance</Text>
          <Text style={[styles.balanceValue, { color: theme.primary }]}>
            {balance.toLocaleString()} pts
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const canAfford = balance >= item.points_cost;
        return (
          <View style={[styles.rewardCard, { borderColor: theme.primary + "30" }]}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.rewardImage} />
            ) : null}
            <View style={styles.rewardContent}>
              <Text style={[styles.rewardName, { color: theme.text }]}>{item.name}</Text>
              {item.description ? (
                <Text style={[styles.rewardDescription, { color: theme.mutedText }]} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <Text style={[styles.rewardCost, { color: theme.primary }]}>
                {item.points_cost.toLocaleString()} pts
              </Text>
            </View>
            <Pressable
              style={[
                styles.redeemButton,
                { backgroundColor: theme.primary },
                (!canAfford || redeemLoading) && styles.redeemDisabled,
              ]}
              onPress={() => handleRedeem(item.id, item.points_cost, item.name)}
              disabled={!canAfford || redeemLoading}
            >
              <Text style={styles.redeemText}>Redeem</Text>
            </Pressable>
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
  balanceBanner: {
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  rewardCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  rewardImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#f0f0f0",
  },
  rewardContent: {
    padding: 16,
  },
  rewardName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  rewardCost: {
    fontSize: 15,
    fontWeight: "700",
  },
  redeemButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  redeemText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  redeemDisabled: {
    opacity: 0.4,
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
});
