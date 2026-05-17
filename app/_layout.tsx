import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { initSync, migrateLocalData } from '../src/services/sync';

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await initSync();
      await migrateLocalData();
    })();
  }, []);

  return (
    <LanguageProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="light" />
    </LanguageProvider>
  );
}