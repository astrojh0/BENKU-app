import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    AppState,
    AppStateStatus,
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Sentence } from '../src/models/sentence';
import { loadSentences } from '../src/utils/storage';

const PLAY_DURATION_KEY = 'ocat_play_duration';

export default function ReviewScreen() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [queue, setQueue] = useState<Sentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [intervalSec, setIntervalSec] = useState<number>(3);
  const [rate, setRate] = useState<number>(1.0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [sleepMin, setSleepMin] = useState<number>(0);
  const [secondPassLowerVolume, setSecondPassLowerVolume] = useState<boolean>(false);
  const [playDuration, setPlayDuration] = useState<number>(0);
  const [sleepRemaining, setSleepRemaining] = useState<number>(0);

  const soundRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sleepTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const listRef = useRef<FlatList>(null);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const playStartRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const refresh = useCallback(async () => {
    const data = await loadSentences();
    setSentences(data);
    if (!shuffle) {
      setQueue(data.slice());
    }
  }, [shuffle]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      const durRaw = await AsyncStorage.getItem(PLAY_DURATION_KEY);
      if (durRaw) setPlayDuration(Number(durRaw) || 0);
    })();
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    currentIndexRef.current = currentIndex;
  }, [isPlaying, currentIndex]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (isPlayingRef.current) {
          scrollToCurrent();
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  function cleanupSound() {
    if (soundRef.current) {
      try { soundRef.current.unloadAsync(); } catch (e) {}
      soundRef.current = null;
    }
  }

  function clearAllTimers() {
    if (intervalRef.current) { clearTimeout(intervalRef.current); intervalRef.current = undefined; }
    if (sleepTimeoutRef.current) { clearTimeout(sleepTimeoutRef.current); sleepTimeoutRef.current = undefined; }
    if (sleepIntervalRef.current) { clearInterval(sleepIntervalRef.current); sleepIntervalRef.current = undefined; }
  }

  function startTrackingPlayDuration() {
    playStartRef.current = Date.now();
  }

  async function stopTrackingPlayDuration() {
    if (playStartRef.current > 0) {
      const elapsed = Math.floor((Date.now() - playStartRef.current) / 1000);
      playStartRef.current = 0;
      if (elapsed > 0) {
        const durRaw = await AsyncStorage.getItem(PLAY_DURATION_KEY);
        const prev = Number(durRaw) || 0;
        const next = prev + elapsed;
        await AsyncStorage.setItem(PLAY_DURATION_KEY, String(next));
        setPlayDuration(next);
      }
    }
  }

  function scheduleNextAfterInterval() {
    if (!isPlayingRef.current) return;
    intervalRef.current = setTimeout(() => {
      gotoNext();
    }, intervalSec * 1000);
  }

  async function playCurrent() {
    const s = queue[currentIndexRef.current];
    if (!s) return;

    cleanupSound();

    if (!s.audioUrl) {
      scheduleNextAfterInterval();
      return;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: s.audioUrl },
        { shouldPlay: true, rate, shouldCorrectPitch: true, volume: 1.0 },
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;
      startTrackingPlayDuration();
    } catch (e) {
      console.warn('playCurrent error', e);
      scheduleNextAfterInterval();
    }
  }

  function onPlaybackStatusUpdate(status: any) {
    if (status.didJustFinish) {
      stopTrackingPlayDuration().then(() => {
        if (secondPassLowerVolume) {
          playCurrentSecondPass();
        } else {
          scheduleNextAfterInterval();
        }
      });
    }
  }

  async function playCurrentSecondPass() {
    const s = queue[currentIndexRef.current];
    if (!s || !s.audioUrl) {
      scheduleNextAfterInterval();
      return;
    }

    cleanupSound();

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: s.audioUrl },
        { shouldPlay: true, rate, shouldCorrectPitch: true, volume: 0.4 },
        (status: any) => {
          if (status.didJustFinish) {
            stopTrackingPlayDuration().then(() => {
              scheduleNextAfterInterval();
            });
          }
        },
      );
      soundRef.current = sound;
      startTrackingPlayDuration();
    } catch (e) {
      console.warn('playCurrentSecondPass error', e);
      scheduleNextAfterInterval();
    }
  }

  function gotoNext() {
    if (queue.length === 0) return;
    const next = (currentIndexRef.current + 1) % queue.length;
    setCurrentIndex(next);
    currentIndexRef.current = next;
    scrollToCurrent();
    playCurrent();
  }

  function gotoPrev() {
    if (queue.length === 0) return;
    const prev = currentIndexRef.current === 0 ? queue.length - 1 : currentIndexRef.current - 1;
    setCurrentIndex(prev);
    currentIndexRef.current = prev;
    scrollToCurrent();
    playCurrent();
  }

  async function togglePlayPause() {
    if (isPlaying) {
      setIsPlaying(false);
      isPlayingRef.current = false;
      clearAllTimers();
      cleanupSound();
      await stopTrackingPlayDuration();
    } else {
      setIsPlaying(true);
      isPlayingRef.current = true;
      startSleepTimerIfNeeded();
      playCurrent();
    }
  }

  function startSleepTimerIfNeeded() {
    clearTimeout(sleepTimeoutRef.current);
    clearInterval(sleepIntervalRef.current);
    if (sleepMin && sleepMin > 0) {
      const totalSec = sleepMin * 60;
      setSleepRemaining(totalSec);
      sleepIntervalRef.current = setInterval(() => {
        setSleepRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(sleepIntervalRef.current!);
            setIsPlaying(false);
            isPlayingRef.current = false;
            clearAllTimers();
            cleanupSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      sleepTimeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
        isPlayingRef.current = false;
        clearAllTimers();
        cleanupSound();
      }, totalSec * 1000);
    } else {
      setSleepRemaining(0);
    }
  }

  function scrollToCurrent() {
    if (!listRef.current) return;
    try {
      listRef.current.scrollToIndex({ index: currentIndexRef.current, animated: true, viewPosition: 0.5 });
    } catch (e) {}
  }

  async function handleJumpTo(index: number) {
    clearAllTimers();
    cleanupSound();
    await stopTrackingPlayDuration();
    setCurrentIndex(index);
    currentIndexRef.current = index;
    setIsPlaying(true);
    isPlayingRef.current = true;
    startSleepTimerIfNeeded();
    setTimeout(() => playCurrent(), 100);
  }

  async function handleToggleShuffle() {
    setShuffle((s) => {
      const next = !s;
      if (next) {
        setQueue(shuffleArray(sentences.slice()));
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      } else {
        setQueue(sentences.slice());
        setCurrentIndex(0);
        currentIndexRef.current = 0;
      }
      return next;
    });
  }

  function shuffleArray<T>(arr: T[]) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  useEffect(() => {
    setQueue(sentences.slice());
  }, [sentences]);

  useEffect(() => {
    scrollToCurrent();
  }, [currentIndex]);

  const sleepDisplay = sleepRemaining > 0
    ? `${Math.floor(sleepRemaining / 60)}:${String(sleepRemaining % 60).padStart(2, '0')}`
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>复习播放器</Text>
        <Text style={styles.subtitle}>
          累计播放 {Math.floor(playDuration / 60)} 分钟
          {sleepDisplay ? ` · 睡眠倒计时 ${sleepDisplay}` : ''}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={queue}
        keyExtractor={(it) => it.id}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => handleJumpTo(index)} style={[styles.item, index === currentIndex && styles.itemActive]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemText}>{item.text}</Text>
              {showTranslation ? <Text style={styles.itemTranslation}>{item.translation}</Text> : null}
              <View style={styles.metaRow}>
                {item.subFolder ? <Text style={styles.metaBadge}>{item.subFolder}</Text> : null}
                {item.tags.map((t: string) => (<Text key={t} style={styles.metaBadge}>{t}</Text>))}
              </View>
            </View>
            <View style={{ width: 80, alignItems: 'center', justifyContent: 'center' }}>
              <Text>{item.audioUrl ? '🔊' : '—'}</Text>
            </View>
          </Pressable>
        )}
        contentContainerStyle={{ padding: 12, paddingBottom: 160 }}
      />

      <View style={styles.controls}>
        <Pressable onPress={() => gotoPrev()} style={styles.ctrlButton}><Text>上一个</Text></Pressable>
        <Pressable onPress={() => togglePlayPause()} style={[styles.ctrlButton, { paddingHorizontal: 20 }]}>
          <Text>{isPlaying ? '暂停' : '播放'}</Text>
        </Pressable>
        <Pressable onPress={() => gotoNext()} style={styles.ctrlButton}><Text>下一个</Text></Pressable>
      </View>

      <View style={styles.settingBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 12 }}>
          <Pressable onPress={() => setShowTranslation((s) => !s)} style={styles.smallButton}><Text>{showTranslation ? '隐藏翻译' : '显示翻译'}</Text></Pressable>
          <Pressable onPress={() => handleToggleShuffle()} style={styles.smallButton}><Text>{shuffle ? '随机:开' : '随机:关'}</Text></Pressable>
          <Pressable onPress={() => setIntervalSec((v) => Math.max(1, v - 1))} style={styles.smallButton}><Text>-间隔</Text></Pressable>
          <Text style={{ alignSelf: 'center', paddingHorizontal: 6 }}>{intervalSec}s</Text>
          <Pressable onPress={() => setIntervalSec((v) => Math.min(10, v + 1))} style={styles.smallButton}><Text>+间隔</Text></Pressable>
          <Pressable onPress={() => setRate((v) => Math.max(0.5, Math.round((v - 0.1) * 10) / 10))} style={styles.smallButton}><Text>-语速</Text></Pressable>
          <Text style={{ alignSelf: 'center', paddingHorizontal: 6 }}>{rate.toFixed(1)}x</Text>
          <Pressable onPress={() => setRate((v) => Math.min(2.0, Math.round((v + 0.1) * 10) / 10))} style={styles.smallButton}><Text>+语速</Text></Pressable>
          <Pressable onPress={() => setSleepMin((v) => Math.max(0, v - 1))} style={styles.smallButton}><Text>-睡眠</Text></Pressable>
          <Text style={{ alignSelf: 'center', paddingHorizontal: 6 }}>{sleepMin}m</Text>
          <Pressable onPress={() => setSleepMin((v) => v + 1)} style={styles.smallButton}><Text>+睡眠</Text></Pressable>
          <Pressable onPress={() => setSecondPassLowerVolume((v) => !v)} style={styles.smallButton}><Text>{secondPassLowerVolume ? '第二遍降音:开' : '第二遍降音:关'}</Text></Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#6B7280', marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12 },
  itemActive: { backgroundColor: '#FEF3C7' },
  itemText: { fontSize: 16, fontWeight: '600' },
  itemTranslation: { color: '#374151', marginTop: 6 },
  metaRow: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  metaBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 8, marginBottom: 6 },
  controls: { position: 'absolute', left: 0, right: 0, bottom: 56, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  ctrlButton: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginHorizontal: 8 },
  settingBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#F8FAFC', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  smallButton: { backgroundColor: '#E6EEF8', paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, marginRight: 8 },
});