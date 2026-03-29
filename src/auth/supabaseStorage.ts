import * as SecureStore from "expo-secure-store";

/**
 * Expo SecureStore adapter for Supabase session persistence.
 * Tokens are stored securely on device (Keychain on iOS, EncryptedSharedPreferences on Android).
 */
export const secureStoreAdapter = {
  getItem: (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): Promise<void> => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): Promise<void> => {
    return SecureStore.deleteItemAsync(key);
  },
};
