import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    AppStateStatus,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { LANGUAGES, useLanguage } from '../../src/contexts/LanguageContext';
import { QueryMode } from '../../src/services/deepseek';
import { sendMessage } from '../../src/services/modelService';
import { Colors } from '../../src/theme';
import { getAllConversations, saveConversation } from '../../src/utils/conversations';
import { extractParseItems, parseAIResponse, ParseItem } from '../../src/utils/japaneseParser';
import { addSentence } from '../../src/utils/storage';
import { speakWithEdgeTTS } from '../../src/utils/tts';
import Bubble from '../components/Bubble';
import HistoryModal, { HistoryItem } from '../components/HistoryModal';
import ModelSelector, { getSelectedModel, ModelType } from '../components/ModelSelector';

const QUICK_BUTTONS: { label: string; mode: QueryMode }[] = [
  { label: '日文怎麼說', mode: 'translate' },
  { label: '什意思', mode: 'explain' },
  { label: '自由提問', mode: 'free' },
];

const LOCALE_MAP: Record<string, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

function getQuickButtonLabel(languageLabel: string): string {
  return `${languageLabel}怎么说`;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  content?: string;
  saved?: boolean;
  createdAt: number;
}

export default function ChatScreen({ onGoToFavorites }: { onGoToFavorites: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryMode, setQueryMode] = useState<QueryMode>('translate');
  const { learningLanguage, learningLanguageLabel, setLearningLanguage } = useLanguage();
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<ModelType>('deepseek');
  const [quickLangMenuVisible, setQuickLangMenuVisible] = useState(false);
  const [quickLangBtnLayout, setQuickLangBtnLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const quickLangBtnRef = useRef<View>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const scrollPosRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    (async () => {
      const model = await getSelectedModel();
      setCurrentModel(model);

      const convs = await getAllConversations();
      const msgs: ChatMessage[] = [];
      for (const c of convs.slice(0, 20).reverse()) {
        const aiResp = c.aiResponse || { sentence: '', content: '' };
        msgs.push({
          id: `${c.id}_user`,
          role: 'user',
          text: c.userInput || '',
          createdAt: c.createdAt || Date.now(),
        });
        msgs.push({
          id: `${c.id}_ai`,
          role: 'ai',
          text: aiResp.sentence || aiResp.content || '',
          content: aiResp.content || aiResp.sentence || '',
          createdAt: c.createdAt || Date.now(),
        });
      }
      setMessages(msgs);
      refreshHistoryList();
    })();
  }, []);

  const refreshHistoryList = useCallback(async () => {
    const convs = await getAllConversations();
    const items: HistoryItem[] = convs
      .filter((c) => c.userInput)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .map((c) => ({
        id: c.sourceConversationId || c.id,
        title: (c.userInput || '').slice(0, 20),
        createdAt: c.createdAt || Date.now(),
      }));
    setHistoryItems(items);
  }, []);

  const loadConversationHistory = useCallback(async (conversationId: string) => {
    const convs = await getAllConversations();
    const conv = convs.find((c) => (c.sourceConversationId || c.id) === conversationId);
    if (!conv) return;

    setActiveConversationId(conversationId);

    const aiResp = conv.aiResponse || { sentence: '', content: '' };
    const msgs: ChatMessage[] = [
      {
        id: `${conv.id}_user`,
        role: 'user',
        text: conv.userInput || '',
        createdAt: conv.createdAt || Date.now(),
      },
      {
        id: `${conv.id}_ai`,
        role: 'ai',
        text: aiResp.sentence || aiResp.content || '',
        content: aiResp.content || aiResp.sentence || '',
        createdAt: conv.createdAt || Date.now(),
      },
    ];
    setMessages(msgs);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        setTimeout(() => {
          if (listRef.current && scrollPosRef.current > 0) {
            try { listRef.current.scrollToOffset({ offset: scrollPosRef.current, animated: false }); } catch (e) {}
          }
        }, 200);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const buildUserMessage = useCallback((rawInput: string, mode: QueryMode): string => {
    const trimmed = rawInput.trim();
    const langName = learningLanguage === 'ja' ? '日语' : learningLanguage === 'en' ? '英语' : learningLanguage === 'ko' ? '韩语' : learningLanguage === 'fr' ? '法语' : learningLanguage === 'de' ? '德语' : learningLanguage === 'es' ? '西班牙语' : '目标语言';
    if (mode === 'translate') {
      return `"${trimmed}"用${langName}怎么说？`;
    }
    if (mode === 'explain') {
      return `"${trimmed}"是什么意思？`;
    }
    return `提问：${trimmed}`;
  }, [learningLanguage]);

  const handleSend = useCallback(async (text?: string, mode?: QueryMode) => {
    const rawMsg = (text || input).trim();
    if (!rawMsg || loading) return;

    const currentMode = mode || queryMode;
    const userMessage = buildUserMessage(rawMsg, currentMode);

    setInput('');
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      text: userMessage,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await sendMessage(userMessage, learningLanguage, currentMode, currentModel);
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'ai',
        text: res.content,
        content: res.content,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      const conversationId = activeConversationId || `deepseek-${Date.now()}`;
      setActiveConversationId(conversationId);
      await saveConversation({
        id: `conv_${Date.now()}`,
        sourceConversationId: conversationId,
        userInput: rawMsg,
        targetLang: learningLanguage,
        aiResponse: {
          sentence: res.content,
          translation: '',
          kana: undefined,
          audio: undefined,
          content: res.content,
        },
        createdAt: Date.now(),
      });
      refreshHistoryList();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '请求失败';
      Alert.alert('错误', errMsg);
    } finally {
      setLoading(false);
    }
  }, [input, loading, queryMode, buildUserMessage, currentModel, learningLanguage, activeConversationId, refreshHistoryList]);

  const handleQuickButton = useCallback((btn: typeof QUICK_BUTTONS[number]) => {
    setQueryMode(btn.mode);
    const rawMsg = input.trim();
    if (!rawMsg) {
      inputRef.current?.focus();
      return;
    }
    handleSend(rawMsg, btn.mode);
  }, [input, handleSend]);

  const handleSaveSentence = useCallback(async (text: string, context?: string) => {
    try {
      await addSentence({
        text,
        translation: context || '',
        kana: null,
        audioUrl: null,
        tags: [learningLanguage],
        subFolder: null,
        mastered: false,
        createdAt: Date.now(),
        sourceConversationId: null,
      });
      Alert.alert('已收藏', `「${text}」已保存到句库`);
    } catch (e) {
      Alert.alert('保存失败', String(e));
    }
  }, [learningLanguage]);

  const handleSpeakWord = useCallback(async (word: string) => {
    try {
      const locale = LOCALE_MAP[learningLanguage] || 'ja-JP';
      await speakWithEdgeTTS(word, locale);
    } catch (e) {
      Alert.alert('朗读失败', String(e));
    }
  }, [learningLanguage]);

  const ParseItemRow = useCallback(({ item }: { item: ParseItem }) => {
    return (
      <View style={styles.parseItemRow}>
        <View style={styles.parseItemContent}>
          <Text style={styles.parseItemText}>
            <Text style={styles.parseItemIndex}>{item.index}. </Text>
            <Text style={styles.parseItemWord}>{item.word}</Text>
            {item.reading ? (
              <Text style={styles.parseItemReading}> ({item.reading})</Text>
            ) : null}
            <Text style={styles.parseItemExplanation}> ：{item.explanation}</Text>
          </Text>
        </View>
        <View style={styles.parseItemActions}>
          <Pressable
            onPress={() => handleSpeakWord(item.word)}
            style={styles.parseActionBtn}>
            <Text style={styles.parseActionText}>朗读</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSaveSentence(item.word, item.explanation)}
            style={styles.parseActionBtn}>
            <Text style={styles.parseActionText}>收藏</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [handleSpeakWord, handleSaveSentence]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.role === 'user') {
      return (
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{item.text}</Text>
        </View>
      );
    }

    const rawContent = item.content || item.text;
    const blocks = parseAIResponse(rawContent);

    return (
      <View style={styles.aiCard}>
        {blocks.map((block, idx) => {
          if (block.type === 'heading') {
            const headingText = block.text.replace(/^\*\*/, '').replace(/\*\*\s*$/, '');
            return (
              <Text key={`h-${idx}`} style={styles.aiHeading}>
                {headingText}
              </Text>
            );
          }

          if (block.type === 'sentence') {
            return (
              <Bubble
                key={`bubble-${idx}`}
                text={block.text}
                context={rawContent.slice(0, 200)}
                learningLang={LOCALE_MAP[learningLanguage] || 'ja-JP'}
              />
            );
          }

          const segText = block.text;
          const segParseItems = extractParseItems(segText);
          if (segParseItems.length > 0) {
            const lines = segText.split('\n');
            const parseStartIdx = lines.findIndex((l) => /^\*\*解析：?\*\*\s*$/.test(l.trim()) || /^\*\*解析\*\*\s*$/.test(l.trim()));
            const beforeParse = parseStartIdx > 0 ? lines.slice(0, parseStartIdx).join('\n') : '';
            const parseSection = lines.slice(Math.max(0, parseStartIdx)).join('\n');

            return (
              <View key={`seg-${idx}`}>
                {beforeParse.trim() ? (
                  <Markdown style={markdownStyles}>{beforeParse}</Markdown>
                ) : null}
                {segParseItems.map((pi) => (
                  <ParseItemRow key={`parse-${pi.index}`} item={pi} />
                ))}
                <Markdown style={markdownStyles}>{parseSection}</Markdown>
              </View>
            );
          }

          return (
            <Markdown key={`seg-${idx}`} style={markdownStyles}>
              {segText}
            </Markdown>
          );
        })}
      </View>
    );
  }, [learningLanguage, ParseItemRow]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onGoToFavorites} style={styles.headerBtn}>
          <Text style={styles.headerIcon}>{'<'}</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>OCAT</Text>
          <ModelSelector onModelChange={setCurrentModel} />
        </View>
        <Pressable onPress={() => setShowHistory(true)} style={styles.headerBtn}>
          <Text style={styles.headerIcon}>{'☰'}</Text>
        </Pressable>
      </View>

      <HistoryModal
        visible={showHistory}
        items={historyItems}
        onClose={() => setShowHistory(false)}
        onSelect={(item) => {
          setShowHistory(false);
          loadConversationHistory(item.id);
        }}
      />

      <Modal
        visible={quickLangMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickLangMenuVisible(false)}>
        <Pressable style={styles.quickLangOverlay} onPress={() => setQuickLangMenuVisible(false)}>
          <View
            style={[
              styles.quickLangMenu,
              {
                top: quickLangBtnLayout.y - 6 * 44 - 4,
                left: quickLangBtnLayout.x,
              },
            ]}>
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === learningLanguage;
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.quickLangMenuItem, isSelected && styles.quickLangMenuItemActive]}
                  onPress={() => {
                    setLearningLanguage(lang.code);
                    setQuickLangMenuVisible(false);
                  }}>
                  <Text style={[styles.quickLangMenuItemText, isSelected && styles.quickLangMenuItemTextActive]}>
                    {lang.label}怎么说
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        onScroll={(e) => { scrollPosRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      />

      <View style={styles.quickRow}>
        {QUICK_BUTTONS.map((btn) => {
          const isActive = queryMode === btn.mode;
          const displayLabel = btn.mode === 'translate' ? getQuickButtonLabel(learningLanguageLabel) : btn.label;

          if (btn.mode === 'translate') {
            return (
              <Pressable
                key={btn.label}
                ref={quickLangBtnRef}
                onPress={() => {
                  if (quickLangBtnRef.current) {
                    quickLangBtnRef.current.measureInWindow((x, y, width, height) => {
                      setQuickLangBtnLayout({ x, y, width, height });
                      setQuickLangMenuVisible(true);
                    });
                  }
                }}
                style={[styles.quickBtn, isActive && styles.quickBtnActive]}>
                <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive]}>
                  {displayLabel} <Text style={styles.quickBtnArrow}>▼</Text>
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={btn.label}
              onPress={() => handleQuickButton(btn)}
              style={[styles.quickBtn, isActive && styles.quickBtnActive]}>
              <Text style={[styles.quickBtnText, isActive && styles.quickBtnTextActive]}>
                {displayLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="输入母语句子或单词..."
          placeholderTextColor={Colors.inputPlaceholder}
          value={input}
          onChangeText={setInput}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
        />
        <Pressable
          onPress={() => handleSend()}
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: { color: Colors.textSecondary, fontSize: 15, lineHeight: 21 },
  heading1: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 16, marginBottom: 8 },
  heading2: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 14, marginBottom: 6 },
  heading3: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 12, marginBottom: 4 },
  heading4: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 10, marginBottom: 4 },
  heading5: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 8, marginBottom: 4 },
  heading6: { fontSize: 14, fontWeight: '600', color: Colors.textMuted, marginTop: 8, marginBottom: 4 },
  paragraph: { marginBottom: 6, marginTop: 0 },
  list_item: { marginBottom: 4, flexDirection: 'row' },
  bullet_list: { marginBottom: 6 },
  ordered_list: { marginBottom: 6 },
  strong: { fontWeight: '600', color: Colors.textPrimary },
  em: { fontStyle: 'italic' },
  code_inline: { backgroundColor: Colors.inputBg, borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace', fontSize: 13, color: Colors.textSecondary },
  fence: { backgroundColor: Colors.inputBg, borderRadius: 8, padding: 12, marginVertical: 8 },
  blockquote: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent,
  },
  hr: { height: 1, backgroundColor: Colors.divider, marginVertical: 8 },
  link: { color: Colors.accent },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.headerBorder,
    backgroundColor: Colors.headerBg,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.headerTitle },
  headerBtn: { padding: 4, marginTop: 2 },
  headerIcon: { fontSize: 22, color: Colors.headerIcon },
  listContent: { paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.bubbleUser,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    maxWidth: '80%',
  },
  userText: { fontSize: 15, color: Colors.bubbleUserText, lineHeight: 21 },
  aiCard: {
    paddingVertical: 4,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  aiHeading: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 6,
  },
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  quickBtn: {
    backgroundColor: Colors.quickBtnBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  quickBtnActive: {
    backgroundColor: Colors.quickBtnActiveBg,
  },
  quickBtnText: { fontSize: 14, color: Colors.quickBtnText, fontWeight: '500' },
  quickBtnTextActive: { color: Colors.quickBtnActiveText },
  quickBtnArrow: { fontSize: 9, color: Colors.quickBtnText },
  quickLangOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  quickLangMenu: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    minWidth: 160,
  },
  quickLangMenuItem: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  quickLangMenuItemActive: {
    backgroundColor: Colors.quickBtnActiveBg,
  },
  quickLangMenuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  quickLangMenuItemTextActive: {
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.headerBorder,
    gap: 10,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.inputBg,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.sendBtn,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendIcon: { color: Colors.bg, fontSize: 18, fontWeight: '700' },
  parseItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.parseItemBorder,
  },
  parseItemContent: {
    flex: 1,
    marginRight: 8,
  },
  parseItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  parseItemIndex: {
    fontWeight: '400',
    color: Colors.textMuted,
    fontSize: 14,
  },
  parseItemWord: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  parseItemReading: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  parseItemExplanation: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  parseItemActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  parseActionBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: Colors.accent,
  },
  parseActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accent,
  },
});