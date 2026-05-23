import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    AppStateStatus,
    FlatList,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Sentence } from '../src/models/sentence';
import { addSentence, deleteSentence, deleteSubfolder, loadSentences, renameSubfolder, toggleMastered } from '../src/utils/storage';
import { speakWord } from '../src/utils/tts';

export default function LibraryScreen() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [reverse, setReverse] = useState(true);
  const [immersion, setImmersion] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSentence, setSelectedSentence] = useState<Sentence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameFolderModal, setShowRenameFolderModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [newText, setNewText] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newKana, setNewKana] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showSceneReview, setShowSceneReview] = useState(false);
  const [sceneData, setSceneData] = useState<any>(null);
  const [sceneLoading, setSceneLoading] = useState(false);
  const [showSubFolderMenu, setShowSubFolderMenu] = useState(false);
  const [subFolderTarget, setSubFolderTarget] = useState<Sentence | null>(null);
  const [subFolderInput, setSubFolderInput] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const listRef = useRef<FlatList>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const scrollPosRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    const data = await loadSentences();
    setSentences(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refresh();
        setTimeout(() => {
          if (listRef.current && scrollPosRef.current > 0) {
            try {
              listRef.current.scrollToOffset({ offset: scrollPosRef.current, animated: false });
            } catch (e) {}
          }
        }, 200);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refresh]);

  const folders = Array.from(new Set(sentences.map((s) => s.subFolder).filter(Boolean) as string[]));

  function filtered() {
    let arr = sentences.slice();
    if (activeFolder) arr = arr.filter((x) => x.subFolder === activeFolder);
    if (reverse) arr = arr.sort((a, b) => b.createdAt - a.createdAt);
    else arr = arr.sort((a, b) => a.createdAt - b.createdAt);
    return arr;
  }

  async function handleToggleMastered(s: Sentence) {
    await toggleMastered(s.id);
    refresh();
  }

  async function handleDelete(s: Sentence) {
    Alert.alert('删除确认', `确定删除「${s.text.slice(0, 20)}…」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { await deleteSentence(s.id); refresh(); } },
    ]);
  }

  async function handleAddManual() {
    if (!newText.trim()) return;
    await addSentence({
      text: newText.trim(),
      translation: newTranslation.trim(),
      kana: newKana.trim() || null,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
      subFolder: newFolderName.trim() || null,
      mastered: false,
      createdAt: Date.now(),
      sourceConversationId: null,
    });
    setNewText('');
    setNewTranslation('');
    setNewKana('');
    setNewTags('');
    setNewFolderName('');
    setShowAddModal(false);
    refresh();
  }

  async function handleAutoSplit() {
    if (!bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const parts = line.split('\t');
      const text = parts[0]?.trim();
      const translation = parts[1]?.trim() || '';
      const kana = parts[2]?.trim() || '';
      if (text) {
        await addSentence({
          text,
          translation,
          kana: kana || null,
          tags: [],
          subFolder: newFolderName.trim() || null,
          mastered: false,
          createdAt: Date.now(),
          sourceConversationId: null,
        });
      }
    }
    setBulkText('');
    setShowBulkModal(false);
    refresh();
    Alert.alert('完成', `已导入 ${lines.length} 条句子`);
  }

  async function handleCreateFolder(name: string) {
    if (!name.trim()) return;
    setShowCreateFolderModal(false);
    setNewFolderName('');
    refresh();
  }

  async function handleAssignSubFolder(sentence: Sentence, folder: string | null) {
    const updated = { ...sentence, subFolder: folder };
    await addSentence(updated);
    refresh();
  }

  async function handleSceneReview(s: Sentence) {
    setShowSceneReview(true);
    setSceneLoading(true);
    try {
      const { getConversation } = require('../src/utils/conversations');
      const conv = await getConversation(s.sourceConversationId);
      setSceneData(conv || null);
    } catch {
      setSceneData(null);
    } finally {
      setSceneLoading(false);
    }
  }

  function stopSpeaking() {
    // placeholder for stop TTS
  }

  function renderWordTokens(text: string) {
    const words = text.split(/(?<=[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff])/g).filter(Boolean);
    return (
      <View style={styles.wordRow}>
        {words.map((w, i) => (
          <Pressable key={i} onPress={() => speakWord(w)}>
            <Text style={styles.wordToken}>{w}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const renderItem = ({ item }: { item: Sentence }) => (
    <Pressable
      onLongPress={() => {
        setSubFolderTarget(item);
        setSubFolderInput(item.subFolder || '');
        setShowSubFolderMenu(true);
      }}
      onPress={() => {
        setSelectedSentence(item);
        setShowDetailModal(true);
        setShowSceneReview(false);
        setSceneData(null);
      }}
      style={styles.item}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemText}>{item.text}</Text>
        {item.kana ? <Text style={styles.itemKana}>{item.kana}</Text> : null}
        <Text style={styles.itemTranslation}>{item.translation}</Text>
        <View style={styles.tagRow}>
          {item.tags.map((t) => (
            <View key={t} style={styles.tagBadge}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => handleToggleMastered(item)} style={styles.iconButton}>
          <Text>{item.mastered ? '✅' : '⬜'}</Text>
        </Pressable>
        <Pressable onPress={() => handleDelete(item)} style={styles.iconButton}>
          <Text>🗑</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, fullscreen && styles.containerFullscreen]}>
      {!fullscreen && (
        <View style={styles.header}>
          <Text style={styles.title}>句库</Text>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setShowAddModal(true)} style={styles.headerButton}><Text>手动录入</Text></Pressable>
            <Pressable onPress={() => setShowBulkModal(true)} style={styles.headerButton}><Text>批量导入</Text></Pressable>
            <Pressable onPress={() => setShowCreateFolderModal(true)} style={styles.headerButton}><Text>＋分栏</Text></Pressable>
            <Pressable onPress={() => setImmersion((p) => !p)} style={styles.headerButton}><Text>{immersion ? '退出沉浸' : '沉浸'}</Text></Pressable>
            <Pressable onPress={() => setReverse((p) => !p)} style={styles.headerButton}><Text>{reverse ? '正序' : '倒序'}</Text></Pressable>
            <Pressable onPress={() => setFullscreen((p) => !p)} style={styles.headerButton}><Text>{fullscreen ? '退出全屏' : '全屏'}</Text></Pressable>
          </View>
        </View>
      )}

      {!fullscreen && (
        <View style={styles.folderRow}>
          <Pressable
            onPress={() => setActiveFolder(null)}
            style={[styles.folderButton, !activeFolder && styles.folderButtonActive]}>
            <Text style={[styles.folderButtonText, !activeFolder && styles.folderButtonTextActive]}>全部</Text>
          </Pressable>
          {folders.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFolder(f)}
              onLongPress={() => { setRenameTarget(f); setNewFolderName(f); setShowRenameFolderModal(true); }}
              style={[styles.folderButton, activeFolder === f && styles.folderButtonActive]}>
              <Text style={[styles.folderButtonText, activeFolder === f && styles.folderButtonTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={filtered()}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: fullscreen ? 0 : 12 }}
        onScroll={(e) => { scrollPosRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      />

      <Modal visible={showDetailModal} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <Pressable onPress={() => { setShowDetailModal(false); stopSpeaking(); }} style={styles.detailClose}>
              <Text style={styles.detailCloseText}>✕ 关闭</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.detailContent}>
            {selectedSentence ? (
              <>
                <Text style={styles.detailSentence}>{selectedSentence.text}</Text>
                {selectedSentence.kana ? (
                  <Text style={styles.detailKana}>{selectedSentence.kana}</Text>
                ) : null}
                <Text style={styles.detailTranslation}>{selectedSentence.translation}</Text>

                <View style={styles.detailDivider} />

                <Text style={styles.detailSectionTitle}>逐词朗读（点击单词）</Text>
                {renderWordTokens(selectedSentence.text)}

                <View style={styles.detailDivider} />

                <Pressable
                  onPress={() => handleSceneReview(selectedSentence)}
                  style={styles.sceneReviewButton}>
                  <Text style={styles.sceneReviewText}>场景回顾</Text>
                </Pressable>

                {showSceneReview ? (
                  <View style={styles.sceneCard}>
                    <Text style={styles.sceneTitle}>原始 AI 对话</Text>
                    {sceneLoading ? (
                      <Text style={styles.sceneLoading}>加载中…</Text>
                    ) : sceneData ? (
                      <>
                        <Text style={styles.sceneLabel}>用户输入：</Text>
                        <Text style={styles.sceneValue}>{sceneData.userInput}</Text>
                        <Text style={styles.sceneLabel}>目标语言：</Text>
                        <Text style={styles.sceneValue}>{sceneData.targetLang}</Text>
                        <Text style={styles.sceneLabel}>AI 回复：</Text>
                        <Text style={styles.sceneValue}>{sceneData.aiResponse.sentence}</Text>
                        <Text style={styles.sceneValue}>{sceneData.aiResponse.translation}</Text>
                        {sceneData.aiResponse.kana ? (
                          <Text style={styles.sceneKana}>{sceneData.aiResponse.kana}</Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={styles.sceneValue}>未找到对话记录</Text>
                    )}
                  </View>
                ) : null}

                <View style={styles.detailDivider} />

                <View style={styles.detailTags}>
                  {selectedSentence.tags.map((t) => (
                    <View key={t} style={styles.detailTagBadge}>
                      <Text style={styles.detailTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.detailMeta}>
                  {selectedSentence.mastered ? '已掌握' : '学习中'} · {new Date(selectedSentence.createdAt).toLocaleDateString()}
                </Text>
              </>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showAddModal} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>手动录入句子</Text>
            <TextInput style={styles.formInput} placeholder="外语句子" value={newText} onChangeText={setNewText} />
            <TextInput style={styles.formInput} placeholder="中文翻译" value={newTranslation} onChangeText={setNewTranslation} />
            <TextInput style={styles.formInput} placeholder="注音（如平假名）" value={newKana} onChangeText={setNewKana} />
            <TextInput style={styles.formInput} placeholder="标签，用逗号分隔" value={newTags} onChangeText={setNewTags} />
            <TextInput style={styles.formInput} placeholder="所属分栏（可选）" value={newFolderName} onChangeText={setNewFolderName} />
            <View style={{ marginTop: 12 }}>
              <Pressable onPress={handleAddManual} style={[styles.actionButton]}><Text style={{ color: '#fff', textAlign: 'center' }}>保存</Text></Pressable>
              <Pressable onPress={() => setShowAddModal(false)} style={[styles.cancelButton]}><Text style={{ textAlign: 'center' }}>取消</Text></Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showBulkModal} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>批量导入课文</Text>
            <Text style={{ color: '#6B7280', marginTop: 8 }}>
              每行一条句子，格式：{'\n'}
              句子[Tab]翻译[Tab]注音{'\n'}
              或直接粘贴课文，点击「自动分解」拆分
            </Text>
            <TextInput
              style={[styles.formInput, { minHeight: 200 }]}
              placeholder="粘贴课文内容…"
              value={bulkText}
              onChangeText={setBulkText}
              multiline
              textAlignVertical="top"
            />
            <TextInput style={styles.formInput} placeholder="所属分栏（可选）" value={newFolderName} onChangeText={setNewFolderName} />
            <View style={{ marginTop: 12 }}>
              <Pressable onPress={handleAutoSplit} style={[styles.actionButton, { backgroundColor: '#FFD43D' }]}>
                <Text style={{ color: '#1F2937', textAlign: 'center' }}>自动分解并导入</Text>
              </Pressable>
              <Pressable onPress={() => setShowBulkModal(false)} style={[styles.cancelButton]}>
                <Text style={{ textAlign: 'center' }}>取消</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showCreateFolderModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>创建分栏</Text>
            <TextInput style={styles.formInput} placeholder="分栏名称" value={newFolderName} onChangeText={setNewFolderName} />
            <View style={{ marginTop: 12 }}>
              <Pressable onPress={() => handleCreateFolder(newFolderName)} style={[styles.actionButton]}><Text style={{ color: '#fff', textAlign: 'center' }}>创建</Text></Pressable>
              <Pressable onPress={() => { setShowCreateFolderModal(false); setNewFolderName(''); }} style={[styles.cancelButton]}><Text style={{ textAlign: 'center' }}>取消</Text></Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showRenameFolderModal} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>重命名分栏</Text>
            <Text style={{ marginTop: 8 }}>{renameTarget}</Text>
            <TextInput style={styles.formInput} placeholder="新的分栏名称" value={newFolderName} onChangeText={setNewFolderName} />
            <View style={{ marginTop: 12 }}>
              <Pressable onPress={async () => { if (renameTarget && newFolderName.trim()) { await renameSubfolder(renameTarget, newFolderName.trim()); setShowRenameFolderModal(false); setNewFolderName(''); refresh(); } }} style={[styles.actionButton]}><Text style={{ color: '#fff', textAlign: 'center' }}>保存</Text></Pressable>
              <Pressable onPress={() => { setShowRenameFolderModal(false); setNewFolderName(''); setRenameTarget(null); }} style={[styles.cancelButton]}><Text style={{ textAlign: 'center' }}>取消</Text></Pressable>
            </View>
            <View style={{ marginTop: 8 }}>
              <Pressable onPress={async () => { if (renameTarget) { await deleteSubfolder(renameTarget); setShowRenameFolderModal(false); setRenameTarget(null); refresh(); } }} style={[styles.cancelButton]}><Text style={{ textAlign: 'center', color: '#DC2626' }}>删除分栏（并将其中句子移至无分组）</Text></Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showSubFolderMenu} animationType="slide" transparent>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12 }}>移动到分栏</Text>
            <Text style={{ color: '#6B7280', marginBottom: 8 }}>
              {subFolderTarget ? subFolderTarget.text.slice(0, 30) : ''}
            </Text>
            <Pressable
              onPress={() => { if (subFolderTarget) handleAssignSubFolder(subFolderTarget, null); setShowSubFolderMenu(false); }}
              style={[styles.folderOption]}>
              <Text style={{ color: '#1F2937' }}>无分组</Text>
            </Pressable>
            {folders.map((f) => (
              <Pressable
                key={f}
                onPress={() => { if (subFolderTarget) handleAssignSubFolder(subFolderTarget, f); setShowSubFolderMenu(false); }}
                style={styles.folderOption}>
                <Text style={{ color: '#1F2937' }}>{f}</Text>
              </Pressable>
            ))}
            <View style={{ marginTop: 12 }}>
              <TextInput
                style={styles.formInput}
                placeholder="新建分栏名称"
                value={subFolderInput}
                onChangeText={setSubFolderInput}
              />
              <Pressable
                onPress={() => {
                  if (subFolderTarget && subFolderInput.trim()) {
                    handleAssignSubFolder(subFolderTarget, subFolderInput.trim());
                    setShowSubFolderMenu(false);
                    setSubFolderInput('');
                  }
                }}
                style={[styles.actionButton, { backgroundColor: '#FFD43D' }]}>
                <Text style={{ color: '#1F2937', textAlign: 'center' }}>创建并移动</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => { setShowSubFolderMenu(false); setSubFolderTarget(null); }} style={[styles.cancelButton]}>
              <Text style={{ textAlign: 'center' }}>取消</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  containerFullscreen: { backgroundColor: '#F5F7FA' },
  header: { padding: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  headerRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  headerButton: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFF8E1', borderRadius: 8, marginRight: 8, marginBottom: 4 },
  folderRow: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, flexWrap: 'wrap' },
  folderButton: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#F3F4F6', borderRadius: 16, marginRight: 8, marginBottom: 8 },
  folderButtonActive: { backgroundColor: '#FFD43D' },
  folderButtonText: { color: '#1F2937', fontSize: 13 },
  folderButtonTextActive: { color: '#1F2937' },
  folderOption: { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  item: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  itemText: { fontSize: 16, fontWeight: '600' },
  itemKana: { color: '#6B7280' },
  itemTranslation: { color: '#4B5563', marginTop: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tagBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginRight: 6, marginBottom: 6 },
  tagText: { color: '#6B7280', fontSize: 12 },
  actions: { marginLeft: 12, alignItems: 'flex-end' },
  iconButton: { paddingVertical: 4, paddingHorizontal: 8, marginBottom: 6, backgroundColor: '#F3F4F6', borderRadius: 8 },
  formInput: { borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 12, marginTop: 12, backgroundColor: '#fff' },
  actionButton: { backgroundColor: '#FFD43D', padding: 12, borderRadius: 12, marginTop: 12 },
  cancelButton: { padding: 12, borderRadius: 12, marginTop: 8, backgroundColor: '#F3F4F6' },
  detailContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  detailHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16 },
  detailClose: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  detailCloseText: { color: '#111827', fontWeight: '600', fontSize: 16 },
  detailContent: { padding: 24, paddingBottom: 80 },
  detailSentence: { fontSize: 36, fontWeight: '800', color: '#111827', lineHeight: 48, marginBottom: 16 },
  detailKana: { fontSize: 22, color: '#6B7280', marginBottom: 12, lineHeight: 30 },
  detailTranslation: { fontSize: 20, color: '#6B7280', lineHeight: 28, marginBottom: 8 },
  detailDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 24 },
  detailSectionTitle: { fontSize: 16, fontWeight: '700', color: '#6B7280', marginBottom: 12 },
  wordRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  wordToken: { fontSize: 22, color: '#FFD43D', fontWeight: '600', marginRight: 6, marginBottom: 4, paddingHorizontal: 4, paddingVertical: 2 },
  sceneReviewButton: { backgroundColor: '#FFD43D', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  sceneReviewText: { color: '#1F2937', fontWeight: '700', fontSize: 16 },
  sceneCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  sceneTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  sceneLoading: { color: '#9CA3AF' },
  sceneLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 8 },
  sceneValue: { fontSize: 15, color: '#374151', marginTop: 4, lineHeight: 22 },
  sceneKana: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  detailTags: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  detailTagBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginRight: 8, marginBottom: 8 },
  detailTagText: { color: '#374151', fontSize: 13 },
  detailMeta: { color: '#9CA3AF', fontSize: 14 },
});