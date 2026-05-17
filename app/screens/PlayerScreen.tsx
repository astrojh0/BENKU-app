import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Sentence } from '../../src/models/sentence';
import { syncLoadPlayDuration, syncLoadSettings, syncSavePlayDuration } from '../../src/services/sync';
import { Colors } from '../../src/theme';
import { loadSentences } from '../../src/utils/storage';

const SETTINGS_KEY = 'ocat_settings';
const PLAY_DURATION_KEY = 'ocat_play_duration';

interface PlaySettings {
  sameSentenceInterval: number;
  diffSentenceInterval: number;
  playCount: number;
  speedSequence: string;
  secondPassLowerVolume: boolean;
}

const DEFAULT_PLAY: PlaySettings = {
  sameSentenceInterval: 3,
  diffSentenceInterval: 3,
  playCount: 4,
  speedSequence: '1x, 0.6x, 1x, 0.5x',
  secondPassLowerVolume: false,
};

export default function PlayerScreen({ folder, onClose }: { folder: string | null; onClose: () => void }) {
  const [queue, setQueue] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<PlaySettings>(DEFAULT_PLAY);
  const [currentPass, setCurrentPass] = useState(0);

  const soundRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const currentPassRef = useRef(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const raw = await syncLoadSettings<PlaySettings>();
      if (raw) {
        try { setSettings({ ...DEFAULT_PLAY, ...raw }); } catch (e) {}
      }
      const data = await loadSentences();
      const filtered = folder ? data.filter((s) => s.subFolder === folder) : data;
      setQueue(filtered);
    })();
  }, [folder]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    currentIndexRef.current = currentIndex;
    currentPassRef.current = currentPass;
  }, [isPlaying, currentIndex, currentPass]);

  useEffect(() => {
    return () => {
      if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch (e) {} }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const parseSpeeds = useCallback(() => {
    return settings.speedSequence.split(',').map((s) => {
      const n = parseFloat(s.trim().replace('x', ''));
      return isNaN(n) ? 1.0 : Math.max(0.3, Math.min(3.0, n));
    });
  }, [settings.speedSequence]);

  const getCurrentSpeed = useCallback(() => {
    const speeds = parseSpeeds();
    return speeds[currentPassRef.current % speeds.length] || 1.0;
  }, [parseSpeeds]);

  const getCurrentVolume = useCallback(() => {
    if (!settings.secondPassLowerVolume) return 1.0;
    return currentPassRef.current % 2 === 0 ? 1.0 : 0.4;
  }, [settings.secondPassLowerVolume]);

  const trackDuration = useCallback(async () => {
    const prev = await syncLoadPlayDuration();
    await syncSavePlayDuration(prev + 1);
  }, []);

  const playCurrent = useCallback(async () => {
    const s = queue[currentIndexRef.current];
    if (!s) return;

    if (soundRef.current) {
      try { soundRef.current.unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }

    if (!s.audioUrl) {
      scheduleNext();
      return;
    }

    try {
      const speed = getCurrentSpeed();
      const volume = getCurrentVolume();
      const { sound } = await Audio.Sound.createAsync(
        { uri: s.audioUrl },
        { shouldPlay: true, rate: speed, shouldCorrectPitch: true, volume },
        (status: any) => {
          if (status.didJustFinish) {
            trackDuration();
            handlePassComplete();
          }
        },
      );
      soundRef.current = sound;
    } catch (e) {
      console.warn('playCurrent error', e);
      scheduleNext();
    }
  }, [queue, getCurrentSpeed, getCurrentVolume, trackDuration]);

  const handlePassComplete = useCallback(() => {
    const nextPass = currentPassRef.current + 1;
    if (nextPass < settings.playCount) {
      setCurrentPass(nextPass);
      currentPassRef.current = nextPass;
      timerRef.current = setTimeout(() => {
        playCurrent();
      }, settings.sameSentenceInterval * 1000);
    } else {
      setCurrentPass(0);
      currentPassRef.current = 0;
      scheduleNext();
    }
  }, [settings, playCurrent]);

  const scheduleNext = useCallback(() => {
    if (!isPlayingRef.current) return;
    timerRef.current = setTimeout(() => {
      const next = (currentIndexRef.current + 1) % queue.length;
      setCurrentIndex(next);
      currentIndexRef.current = next;
      setCurrentPass(0);
      currentPassRef.current = 0;
      scrollToCurrent();
      playCurrent();
    }, settings.diffSentenceInterval * 1000);
  }, [queue.length, settings.diffSentenceInterval, playCurrent]);

  const scrollToCurrent = useCallback(() => {
    if (!listRef.current) return;
    try {
      listRef.current.scrollToIndex({ index: currentIndexRef.current, animated: true, viewPosition: 0.5 });
    } catch (e) {}
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch (e) {} }
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      playCurrent();
    }
  }, [isPlaying, playCurrent]);

  const handlePrev = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch (e) {} }
    const prev = currentIndexRef.current === 0 ? queue.length - 1 : currentIndexRef.current - 1;
    setCurrentIndex(prev);
    currentIndexRef.current = prev;
    setCurrentPass(0);
    currentPassRef.current = 0;
    scrollToCurrent();
    if (isPlayingRef.current) playCurrent();
  }, [queue.length, playCurrent]);

  const handleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch (e) {} }
    const next = (currentIndexRef.current + 1) % queue.length;
    setCurrentIndex(next);
    currentIndexRef.current = next;
    setCurrentPass(0);
    currentPassRef.current = 0;
    scrollToCurrent();
    if (isPlayingRef.current) playCurrent();
  }, [queue.length, playCurrent]);

  const currentSentence = queue[currentIndex];

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>磨耳朵</Text>
          <Text style={styles.progressText}>{currentIndex + 1}/{queue.length}</Text>
        </View>

        {currentSentence ? (
          <View style={styles.nowPlaying}>
            <Text style={styles.nowSentence}>{currentSentence.text}</Text>
            {currentSentence.kana ? <Text style={styles.nowKana}>{currentSentence.kana}</Text> : null}
            <Text style={styles.nowTranslation}>{currentSentence.translation}</Text>
            <Text style={styles.passInfo}>
              第 {currentPass + 1}/{settings.playCount} 遍 · {getCurrentSpeed().toFixed(1)}x
            </Text>
          </View>
        ) : (
          <View style={styles.nowPlaying}>
            <Text style={styles.emptyText}>暂无句子</Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={queue}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                if (soundRef.current) { try { soundRef.current.unloadAsync(); } catch (e) {} }
                setCurrentIndex(index);
                currentIndexRef.current = index;
                setCurrentPass(0);
                currentPassRef.current = 0;
                if (isPlayingRef.current) playCurrent();
              }}
              style={[styles.item, index === currentIndex && styles.itemActive]}>
              <Text style={styles.itemText} numberOfLines={1}>{item.text}</Text>
              <Text style={styles.itemTranslation} numberOfLines={1}>{item.translation}</Text>
            </Pressable>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        />

        <View style={styles.controls}>
          <Pressable onPress={handlePrev} style={styles.ctrlBtn}>
            <Text style={styles.ctrlText}>⏮</Text>
          </Pressable>
          <Pressable onPress={handleTogglePlay} style={[styles.ctrlBtn, styles.playBtn]}>
            <Text style={styles.playText}>{isPlaying ? '⏸' : '▶️'}</Text>
          </Pressable>
          <Pressable onPress={handleNext} style={styles.ctrlBtn}>
            <Text style={styles.ctrlText}>⏭</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.headerBorder,
    backgroundColor: Colors.headerBg,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 20, color: Colors.closeText },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.headerTitle },
  progressText: { fontSize: 14, color: Colors.progressText },
  nowPlaying: {
    padding: 20,
    backgroundColor: Colors.nowPlayingBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.nowPlayingBorder,
    alignItems: 'center',
  },
  nowSentence: { fontSize: 22, fontWeight: '700', color: Colors.nowSentence, textAlign: 'center', marginBottom: 6 },
  nowKana: { fontSize: 16, color: Colors.nowKana, textAlign: 'center', marginBottom: 6 },
  nowTranslation: { fontSize: 15, color: Colors.nowTranslation, textAlign: 'center', marginBottom: 8 },
  passInfo: { fontSize: 13, color: Colors.passInfo },
  emptyText: { fontSize: 16, color: Colors.emptyText, textAlign: 'center' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.card,
  },
  itemActive: { backgroundColor: Colors.itemActiveBg, borderWidth: 1, borderColor: Colors.itemActiveBorder },
  itemText: { fontSize: 15, fontWeight: '600', color: Colors.itemText, flex: 1, marginRight: 12 },
  itemTranslation: { fontSize: 13, color: Colors.itemTranslation, maxWidth: '40%' },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  ctrlBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.ctrlBtnBg, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.playBtnBg, justifyContent: 'center', alignItems: 'center' },
  ctrlText: { fontSize: 22 },
  playText: { fontSize: 28 },
});