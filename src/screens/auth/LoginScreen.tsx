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

export function LoginScreen({ navigation, brand }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setBusy(true);
    const result = await signIn(email.trim(), password);
    setBusy(false);
    if (result.error) setError(result.error);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: brand.backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: brand.textColor }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: brand.mutedTextColor }]}>
          Enter your credentials to continue
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
          textContentType="password"
          autoComplete="password"
        />

        <Pressable
          style={[styles.button, { backgroundColor: brand.primaryColor }]}
          onPress={handleSignIn}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={brand.backgroundColor} />
          ) : (
            <Text style={[styles.buttonText, { color: brand.backgroundColor }]}>Sign In</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.navigate("ForgotPassword")} style={styles.link}>
          <Text style={[styles.linkText, { color: brand.primaryColor }]}>Forgot password?</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("SignUp")} style={styles.link}>
          <Text style={[styles.linkText, { color: brand.mutedTextColor }]}>
            Don't have an account?{" "}
            <Text style={{ color: brand.primaryColor }}>Sign Up</Text>
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
  subtitle: { fontSize: 16, marginBottom: 24 },
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
