import React, { useCallback, useState } from 'react';
import {
    Alert,
    Clipboard,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../src/theme';
import { addSentence } from '../../src/utils/storage';
import { speakWithEdgeTTS } from '../../src/utils/tts';

interface BubbleProps {
  text: string;
  context?: string;
  learningLang?: string;
}

export default function Bubble({ text, context, learningLang }: BubbleProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handlePress = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const handleSpeak = useCallback(async () => {
    setMenuVisible(false);
    try {
      await speakWithEdgeTTS(text, learningLang);
    } catch (e) {
      Alert.alert('朗读失败', String(e));
    }
  }, [text, learningLang]);

  const handleSave = useCallback(async () => {
    setMenuVisible(false);
    try {
      await addSentence({
        text,
        translation: context || '',
        kana: null,
        audioUrl: null,
        tags: learningLang ? [learningLang] : [],
        subFolder: null,
        mastered: false,
        createdAt: Date.now(),
        sourceConversationId: null,
      });
      Alert.alert('已收藏', `「${text}」已保存到句库`);
    } catch (e) {
      Alert.alert('收藏失败', String(e));
    }
  }, [text, context, learningLang]);

  const handleCopy = useCallback(() => {
    setMenuVisible(false);
    Clipboard.setString(text);
    Alert.alert('已复制', '句子已复制到剪贴板');
  }, [text]);

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        style={styles.bubble}>
        <Text style={styles.bubbleText}>{text}</Text>
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          style={styles.overlay}
          onPress={() => setMenuVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle} numberOfLines={2}>{text}</Text>
            <View style={styles.sheetDivider} />

            <Pressable style={styles.sheetRow} onPress={handleSpeak}>
              <Text style={styles.sheetIcon}>🔊</Text>
              <Text style={styles.sheetLabel}>朗读</Text>
            </Pressable>

            <Pressable style={styles.sheetRow} onPress={handleSave}>
              <Text style={styles.sheetIcon}>⭐</Text>
              <Text style={styles.sheetLabel}>加入收藏</Text>
            </Pressable>

            <Pressable style={styles.sheetRow} onPress={handleCopy}>
              <Text style={styles.sheetIcon}>📋</Text>
              <Text style={styles.sheetLabel}>复制</Text>
            </Pressable>

            <View style={styles.sheetDivider} />
            <Pressable
              style={styles.sheetRow}
              onPress={() => setMenuVisible(false)}>
              <Text style={[styles.sheetLabel, { textAlign: 'center', color: Colors.sheetCancel }]}>
                取消
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: Colors.bubbleUser,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 6,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.sheetBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.sheetTitle,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  sheetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.sheetDivider,
    marginVertical: 4,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  sheetIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  sheetLabel: {
    fontSize: 16,
    color: Colors.sheetLabel,
  },
});
