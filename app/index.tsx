import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    View,
    Pressable,
    Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme';
import ChatScreen from './screens/ChatScreen';
import FavoritesScreen from './screens/FavoritesScreen';
import PlayerScreen from './screens/PlayerScreen';
import SettingsScreen from './screens/SettingsScreen';
import { GlassColors, GlassSpacing, GlassRadius } from '../src/theme/advanced-glassmorphism';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RootScreen() {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [activePage, setActivePage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerFolder, setPlayerFolder] = useState<string | null>(null);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('benku_settings');
      if (raw) {
        try {
          const s = JSON.parse(raw);
          setImmersiveMode(!!s.immersiveMode);
        } catch (e) {}
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const raw = await AsyncStorage.getItem('benku_settings');
      if (raw) {
        try {
          const s = JSON.parse(raw);
          setImmersiveMode(!!s.immersiveMode);
        } catch (e) {}
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: SCREEN_WIDTH, animated: false });
    }
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const page = Math.round(x / SCREEN_WIDTH);
    setActivePage(page);
  }, []);

  const handleGoToFavorites = useCallback(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  }, []);

  const handleGoToChat = useCallback(() => {
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
  }, []);

  const handleOpenSettings = useCallback(() => setShowSettings(true), []);
  const handleCloseSettings = useCallback(() => setShowSettings(false), []);

  const handleOpenPlayer = useCallback((folder: string | null) => {
    setPlayerFolder(folder);
    setShowPlayer(true);
  }, []);
  const handleClosePlayer = useCallback(() => setShowPlayer(false), []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable
        style={styles.previewButton}
        onPress={() => router.push('/glass-preview')}>
        <Text style={styles.previewButtonText}>✨ 预览毛玻璃设计</Text>
      </Pressable>
      
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.swiper}>
        <View style={styles.page}>
          <FavoritesScreen onOpenPlayer={handleOpenPlayer} onOpenSettings={handleOpenSettings} />
        </View>
        <View style={styles.page}>
          <ChatScreen onGoToFavorites={handleGoToFavorites} />
        </View>
      </ScrollView>

      {!immersiveMode && (
        <View style={[styles.indicator, { bottom: insets.bottom + 8 }]}>
          <View style={[styles.dot, activePage === 0 && styles.dotActive]} />
          <View style={[styles.dot, activePage === 1 && styles.dotActive]} />
        </View>
      )}

      {showSettings && <SettingsScreen onClose={handleCloseSettings} />}
      {showPlayer && <PlayerScreen folder={playerFolder} onClose={handleClosePlayer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  swiper: { flex: 1 },
  page: { width: SCREEN_WIDTH, flex: 1 },
  indicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dotInactive },
  dotActive: { backgroundColor: Colors.dotActive, width: 18 },
  previewButton: {
    position: 'absolute',
    top: insets.top + 70,
    right: 16,
    backgroundColor: GlassColors.glassPrimary,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    borderRadius: GlassRadius.md,
    paddingVertical: GlassSpacing.sm,
    paddingHorizontal: GlassSpacing.md,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: GlassColors.textPrimary,
  },
});