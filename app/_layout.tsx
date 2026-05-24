import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider, useLanguage } from '../src/contexts/LanguageContext';
import { initSync, migrateLocalData } from '../src/services/sync';
import { NativeLanguageModal } from './components/NativeLanguageModal';

function RootLayoutContent() {
  const { hasSeenNativePrompt, setHasSeenNativePrompt, setNativeLanguage, learningLanguage } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 延迟显示弹窗，确保上下文已加载
    const timer = setTimeout(() => {
      if (!hasSeenNativePrompt) {
        setShowModal(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [hasSeenNativePrompt]);

  const handleSelectNativeLanguage = async (code: string) => {
    await setNativeLanguage(code);
    await setHasSeenNativePrompt(true);
    setShowModal(false);
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="light" />
      <NativeLanguageModal
        visible={showModal}
        onSelect={handleSelectNativeLanguage}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await initSync();
      await migrateLocalData();
    })();
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <RootLayoutContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
