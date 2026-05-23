import React, { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
} from 'react-native';
import { version as appVersion } from '../../package.json';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { syncLoadPlayDuration, syncLoadSettings, syncSaveSettings } from '../../src/services/sync';
import { Colors } from '../../src/theme';

const SETTINGS_KEY = 'benku_settings';

interface Settings {
  playTranslation: boolean;
  sameSentenceInterval: number;
  diffSentenceInterval: number;
  playCount: number;
  speedSequence: string;
  secondPassLowerVolume: boolean;
  nativeLang: string;
  learningLang: string;
  gender: string;
  immersiveMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  playTranslation: false,
  sameSentenceInterval: 3,
  diffSentenceInterval: 3,
  playCount: 4,
  speedSequence: '1x, 0.6x, 1x, 0.5x',
  secondPassLowerVolume: false,
  nativeLang: 'zh',
  learningLang: 'ja',
  gender: 'male',
  immersiveMode: false,
};

const LANGUAGES = [
  { code: 'ja', label: '日语' },
  { code: 'en', label: '英语' },
  { code: 'ko', label: '韩语' },
  { code: 'fr', label: '法语' },
  { code: 'de', label: '德语' },
  { code: 'es', label: '西班牙语' },
  { code: 'zh', label: '中文' },
];

const NATIVE_LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: '英语' },
  { code: 'ja', label: '日语' },
  { code: 'ko', label: '韩语' },
  { code: 'es', label: '西班牙语' },
];

export default function SettingsScreen({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [playDuration, setPlayDuration] = useState(0);
  const { learningLanguage, setLearningLanguage, nativeLanguage, setNativeLanguage } = useLanguage();

  useEffect(() => {
    (async () => {
      const raw = await syncLoadSettings<Settings>();
      if (raw) {
        try { setSettings({ ...DEFAULT_SETTINGS, ...raw }); } catch (e) {}
      }
      const dur = await syncLoadPlayDuration();
      if (dur) setPlayDuration(dur);
    })();
  }, []);

  useEffect(() => {
    if (learningLanguage && learningLanguage !== settings.learningLang) {
      update({ learningLang: learningLanguage });
    }
  }, [learningLanguage]);

  useEffect(() => {
    if (nativeLanguage && nativeLanguage !== settings.nativeLang) {
      update({ nativeLang: nativeLanguage });
    }
  }, [nativeLanguage]);

  const update = async (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    await syncSaveSettings(next);
    
    // 同步到 LanguageContext
    if (patch.learningLang) {
      await setLearningLanguage(patch.learningLang);
    }
    if (patch.nativeLang) {
      await setNativeLanguage(patch.nativeLang);
      Alert.alert('母语已更新', `你的母语已设置为 ${NATIVE_LANGS.find(l => l.code === patch.nativeLang)?.label || patch.nativeLang}`);
    }
  };

  const handleClearCache = () => {
    Alert.alert('清除缓存', '确认清除所有本地数据？', [
      { text: '取消', style: 'cancel' },
      { text: '确认', style: 'destructive', onPress: async () => {
        setSettings(DEFAULT_SETTINGS);
        setPlayDuration(0);
      }},
    ]);
  };

  const hours = Math.floor(playDuration / 3600);
  const minutes = Math.floor((playDuration % 3600) / 60);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>设置</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>账号</Text>
          <View style={styles.card}>
            <Text style={styles.rowLabel}>邮箱</Text>
            <Text style={styles.rowValue}>demo@benku.app</Text>
          </View>

          <Text style={styles.sectionTitle}>语音</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>播放翻译</Text>
              <Switch value={settings.playTranslation} onValueChange={(v) => update({ playTranslation: v })} />
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>同一句间隔 (秒)</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => update({ sameSentenceInterval: Math.max(1, settings.sameSentenceInterval - 1) })} style={styles.stepBtn}><Text>-</Text></Pressable>
                <Text style={styles.stepValue}>{settings.sameSentenceInterval}</Text>
                <Pressable onPress={() => update({ sameSentenceInterval: Math.min(10, settings.sameSentenceInterval + 1) })} style={styles.stepBtn}><Text>+</Text></Pressable>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>不同句间隔 (秒)</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => update({ diffSentenceInterval: Math.max(1, settings.diffSentenceInterval - 1) })} style={styles.stepBtn}><Text>-</Text></Pressable>
                <Text style={styles.stepValue}>{settings.diffSentenceInterval}</Text>
                <Pressable onPress={() => update({ diffSentenceInterval: Math.min(10, settings.diffSentenceInterval + 1) })} style={styles.stepBtn}><Text>+</Text></Pressable>
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>原文播放次数</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => update({ playCount: Math.max(1, settings.playCount - 1) })} style={styles.stepBtn}><Text>-</Text></Pressable>
                <Text style={styles.stepValue}>{settings.playCount}</Text>
                <Pressable onPress={() => update({ playCount: Math.min(10, settings.playCount + 1) })} style={styles.stepBtn}><Text>+</Text></Pressable>
              </View>
            </View>
            <View style={[styles.row, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.rowLabel}>语速序列</Text>
              <TextInput
                style={styles.textInput}
                value={settings.speedSequence}
                onChangeText={(v) => update({ speedSequence: v })}
                placeholder="1x, 0.6x, 1x, 0.5x"
              />
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>第二遍降低音量</Text>
              <Switch value={settings.secondPassLowerVolume} onValueChange={(v) => update({ secondPassLowerVolume: v })} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>通用</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>母语</Text>
              <View style={styles.chipRow}>
                {NATIVE_LANGS.map((l) => (
                  <Pressable key={l.code} onPress={() => update({ nativeLang: l.code })} style={[styles.chip, settings.nativeLang === l.code && styles.chipActive]}>
                    <Text style={[styles.chipText, settings.nativeLang === l.code && styles.chipTextActive]}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>学习语言</Text>
              <View style={styles.chipRow}>
                {LANGUAGES.filter(l => l.code !== nativeLanguage).map((l) => (
                  <Pressable
                    key={l.code}
                    onPress={() => {
                      update({ learningLang: l.code });
                      setLearningLanguage(l.code);
                    }}
                    style={[styles.chip, learningLanguage === l.code && styles.chipActive]}>
                    <Text style={[styles.chipText, learningLanguage === l.code && styles.chipTextActive]}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>性别</Text>
              <View style={styles.chipRow}>
                {[{ code: 'male', label: '男性' }, { code: 'female', label: '女性' }].map((g) => (
                  <Pressable key={g.code} onPress={() => update({ gender: g.code })} style={[styles.chip, settings.gender === g.code && styles.chipActive]}>
                    <Text style={[styles.chipText, settings.gender === g.code && styles.chipTextActive]}>{g.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>沉浸模式</Text>
              <Switch value={settings.immersiveMode} onValueChange={(v) => update({ immersiveMode: v })} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>数据</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>累计播放时长</Text>
              <Text style={styles.rowValue}>{hours} 小时 {minutes} 分钟</Text>
            </View>
            <Pressable onPress={handleClearCache} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>清除所有缓存</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.card}>
            <Text style={styles.aboutTitle}>BENKU v{appVersion}</Text>
            <Text style={styles.aboutText}>
              BENKU 源自日语「おしえて（oshiete）」— 请教教我。{'\n\n'}
              背单词不如背句子！通过 AI 生成地道的目标语言句子，配合语音播放和收藏管理，让语言学习更高效。
            </Text>
          </View>

          <Text style={styles.sectionTitle}>理念</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              BENKU 的核心理念是「可理解输入」（Comprehensible Input）。{'\n\n'}
              我们相信，语言习得的最佳方式不是死记硬背单词和语法规则，而是通过大量接触可理解的、有意义的句子，在语境中自然掌握语言。{'\n\n'}
              AI 技术让每个学习者都能获得个性化的、符合自己水平的语言输入，让语言学习变得更加高效和有趣。
            </Text>
          </View>

          <View style={styles.linkCard}>
            <Pressable onPress={() => Linking.openURL('https://github.com/astrojh0/benku-app')} style={styles.linkRow}>
              <Text style={styles.link}>开源许可: MIT</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://benku.app/privacy')} style={styles.linkRow}>
              <Text style={styles.link}>隐私政策</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://benku.app/terms')} style={styles.linkRow}>
              <Text style={styles.link}>用户协议</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, width: '100%', overflow: 'hidden' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.headerBorder,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 20, color: Colors.closeText },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.headerTitle },
  content: { padding: 16, paddingBottom: 48 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.sectionTitle, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: Colors.card, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: Colors.headerBorder },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  rowLabel: { fontSize: 15, color: Colors.rowLabel, flex: 1 },
  rowValue: { fontSize: 15, color: Colors.rowValue },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.stepperBg, justifyContent: 'center', alignItems: 'center' },
  stepValue: { fontSize: 15, fontWeight: '600', color: Colors.stepperText, minWidth: 24, textAlign: 'center' },
  textInput: { borderWidth: 1, borderColor: Colors.textInputBorder, borderRadius: 10, padding: 10, fontSize: 14, color: Colors.textInputText, marginTop: 8, width: '100%', backgroundColor: Colors.textInputBg },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: Colors.chipBg },
  chipActive: { backgroundColor: Colors.chipActiveBg },
  chipText: { fontSize: 13, color: Colors.chipText },
  chipTextActive: { color: Colors.chipActiveText },
  clearBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.clearBtnBg, alignItems: 'center' },
  clearBtnText: { fontSize: 15, color: Colors.clearBtnText, fontWeight: '600' },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: Colors.aboutTitle, marginBottom: 8 },
  aboutText: { fontSize: 14, color: Colors.aboutText, lineHeight: 22, marginBottom: 12 },
  linkCard: { backgroundColor: Colors.linkCardBg, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: Colors.linkCardBorder, marginTop: 16 },
  linkRow: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  link: { fontSize: 14, color: Colors.link },
});