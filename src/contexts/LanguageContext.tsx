import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'ja', label: '日语' },
  { code: 'en', label: '英语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西班牙语' },
];

const STORAGE_KEY = 'learning_language';

function getLangLabel(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label || '目标语言';
}

interface LanguageContextValue {
  learningLanguage: string;
  learningLanguageLabel: string;
  setLearningLanguage: (code: string) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  learningLanguage: 'ja',
  learningLanguageLabel: '日语',
  setLearningLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [learningLanguage, setLearningLanguageState] = useState('ja');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && LANGUAGES.some((l) => l.code === stored)) {
          setLearningLanguageState(stored);
        }
      } catch (e) { /* ignore */ }
    })();
  }, []);

  const setLearningLanguage = useCallback(async (code: string) => {
    setLearningLanguageState(code);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, code);
    } catch (e) { /* ignore */ }
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        learningLanguage,
        learningLanguageLabel: getLangLabel(learningLanguage),
        setLearningLanguage,
      }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}

export { getLangLabel };