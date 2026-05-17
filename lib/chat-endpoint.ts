import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * URL for the Expo Router `+api` chat route.
 * Web: absolute same-origin URL so fetch always targets the page host (avoids edge cases with base URLs / proxies).
 * Native: dev server from the app manifest.
 */
export function getChatEndpointUrl(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return `${window.location.origin}/api/chat`;
    }
    return '/api/chat';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const base = hostUri.startsWith('http') ? hostUri : `http://${hostUri}`;
    return `${base.replace(/\/$/, '')}/api/chat`;
  }

  return 'http://localhost:8081/api/chat';
}
