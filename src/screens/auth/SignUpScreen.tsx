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

export function SignUpScreen({ navigation, brand }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await signUp(email.trim(), password);
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
            We sent a confirmation link to {email}. Tap it to activate your account, then come
            back and sign in.
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
        <Text style={[styles.title, { color: brand.textColor }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: brand.mutedTextColor }]}>
          Sign up to access all features
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

        <TextInput
          style={[styles.input, { color: brand.textColor, borderColor: brand.mutedTextColor }]}
          placeholder="Password"
          placeholderTextColor={brand.mutedTextColor}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
        />

        <TextInput
          style={[styles.input, { color: brand.textColor, borderColor: brand.mutedTextColor }]}
          placeholder="Confirm Password"
          placeholderTextColor={brand.mutedTextColor}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
        />

        <Pressable
          style={[styles.button, { backgroundColor: brand.primaryColor }]}
          onPress={handleSignUp}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={brand.backgroundColor} />
          ) : (
            <Text style={[styles.buttonText, { color: brand.backgroundColor }]}>
              Create Account
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")} style={styles.link}>
          <Text style={[styles.linkText, { color: brand.mutedTextColor }]}>
            Already have an account?{" "}
            <Text style={{ color: brand.primaryColor }}>Sign In</Text>
          </Text>
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
