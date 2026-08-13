import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * expo-secure-store has no real web implementation (no Keychain/Keystore there) and throws
 * instead of no-op'ing. AsyncStorage is fine as a web fallback — it's only used for the local
 * `expo start --web` preview, not for the installed APK, which always uses real SecureStore
 * on-device. The two libraries have different method names, so this normalizes them.
 */
export const tokenStorage =
  Platform.OS === 'web'
    ? {
        getItemAsync: (key: string) => AsyncStorage.getItem(key),
        setItemAsync: (key: string, value: string) => AsyncStorage.setItem(key, value),
        deleteItemAsync: (key: string) => AsyncStorage.removeItem(key),
      }
    : {
        getItemAsync: SecureStore.getItemAsync,
        setItemAsync: SecureStore.setItemAsync,
        deleteItemAsync: SecureStore.deleteItemAsync,
      };
