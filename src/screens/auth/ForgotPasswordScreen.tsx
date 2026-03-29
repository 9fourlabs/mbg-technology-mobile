import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../../auth/AuthProvider";
import type { BrandConfig } from "../../templates/types";

type Props = NativeStackScreenProps<any> & { brand: BrandConfig };

export function ForgotPasswordScreen({ navigation, brand }: Props) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await resetPassword(email.trim());
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: brand.backgroundColor }]}>
        <View style={styles.inner}>
          <Text style={[styles.title, { color: brand.textColor }]}>Check Your Email</Text>
          <Text style={[styles.subtitle, { color: brand.mutedTextColor }]}>
            If an account exists for {email}, we sent a password reset link.
          </Text>
          <Pressable onPress={() => navigation.navigate("Login")} style={styles.link}>
            <Text style={[styles.linkText, { color: brand.primaryColor }]}>Back to Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: brand.backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: brand.textColor }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: brand.mutedTextColor }]}>
          Enter your email and we'll send you a reset link
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={[styles.input, { color: brand.textColor, borderColor: brand.mutedTextColor }]}
          placeholder="Email"
          placeholderTextColor={brand.mutedTextColor}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <Pressable
          style={[styles.button, { backgroundColor: brand.primaryColor }]}
          onPress={handleReset}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={brand.backgroundColor} />
          ) : (
            <Text style={[styles.buttonText, { color: brand.backgroundColor }]}>
              Send Reset Link
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")} style={styles.link}>
          <Text style={[styles.linkText, { color: brand.primaryColor }]}>Back to Sign In</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24, lineHeight: 22 },
  error: { color: "#ef4444", fontSize: 14, marginBottom: 12, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  link: { alignItems: "center", paddingVertical: 8 },
  linkText: { fontSize: 14 },
});
