import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import type { BrandConfig } from "../../templates/types";

type Props = {
  brand: BrandConfig;
};

export function ProfileScreen({ brand }: Props) {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[styles.avatar, { backgroundColor: brand.primaryColor }]}>
          <Text style={[styles.avatarText, { color: brand.backgroundColor }]}>
            {(user?.email?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.label, { color: brand.mutedTextColor }]}>Email</Text>
        <Text style={[styles.value, { color: brand.textColor }]}>{user?.email ?? "Unknown"}</Text>

        <Text style={[styles.label, { color: brand.mutedTextColor, marginTop: 16 }]}>
          Member since
        </Text>
        <Text style={[styles.value, { color: brand.textColor }]}>
          {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
        </Text>
      </View>

      <Pressable
        style={[styles.signOutButton, { borderColor: "#ef4444" }]}
        onPress={handleSignOut}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#ef4444" />
        ) : (
          <Text style={styles.signOutText}>Sign Out</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  card: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatarText: { fontSize: 28, fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 },
  value: { fontSize: 18, fontWeight: "600", marginTop: 4 },
  signOutButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});
