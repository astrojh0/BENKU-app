import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActionSheetIOS,
    Alert,
    AppState,
    AppStateStatus,
    FlatList,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { Sentence } from '../../src/models/sentence';
import { Colors } from '../../src/theme';
import {
    addFolder,
    deleteSentence,
    deleteSubfolder,
    loadFolders,
    loadSentences,
    moveSentenceToFolder,
    renameSubfolder,
    toggleMastered,
} from '../../src/utils/storage';

export default function FavoritesScreen({ onOpenPlayer, onOpenSettings }: { onOpenPlayer: (folder: string | null) => void; onOpenSettings: () => void }) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [folderInput, setFolderInput] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuTarget, setMenuTarget] = useState<Sentence | null>(null);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [moveTarget, setMoveTarget] = useState<Sentence | null>(null);
  const [reverseOrder, setReverseOrder] = useState(false);

  const listRef = useRef<FlatList>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const scrollPosRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    const [data, f] = await Promise.all([loadSentences(), loadFolders()]);
    setSentences(data);
    setFolders(f);
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
            try { listRef.current.scrollToOffset({ offset: scrollPosRef.current, animated: false }); } catch (e) {}
          }
        }, 200);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refresh]);

  const filtered = useCallback(() => {
    let arr = sentences.slice();
    if (activeFolder) arr = arr.filter((s) => s.subFolder === activeFolder);
    arr.sort((a, b) => b.createdAt - a.createdAt);
    if (reverseOrder) arr.reverse();
    return arr;
  }, [sentences, activeFolder, reverseOrder]);

  const handleLongPress = useCallback((item: Sentence) => {
    setMenuTarget(item);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['移动到收藏夹', '标记已掌握', '删除', '取消'],
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
        },
        async (index) => {
          if (index === 0) { setMoveTarget(item); setShowMoveMenu(true); }
          if (index === 1) { await toggleMastered(item.id); refresh(); }
          if (index === 2) {
            Alert.alert('删除确认', `确定删除「${item.text.slice(0, 20)}…」？`, [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: async () => { await deleteSentence(item.id); refresh(); } },
            ]);
          }
        },
      );
    } else {
      setShowMenu(true);
    }
  }, [refresh]);

  const handleCreateFolder = useCallback(async () => {
    if (!folderInput.trim()) return;
    await addFolder(folderInput.trim());
    setFolderInput('');
    setShowCreateFolder(false);
    refresh();
  }, [folderInput, refresh]);

  const handleRenameFolder = useCallback(async () => {
    if (!renameTarget || !folderInput.trim()) return;
    await renameSubfolder(renameTarget, folderInput.trim());
    setFolderInput('');
    setRenameTarget(null);
    setShowRenameFolder(false);
    refresh();
  }, [renameTarget, folderInput, refresh]);

  const handleDeleteFolder = useCallback(async () => {
    if (!renameTarget) return;
    Alert.alert('删除收藏夹', `确定删除「${renameTarget}」？句子将移至未分类。`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteSubfolder(renameTarget);
        setFolderInput('');
        setRenameTarget(null);
        setShowRenameFolder(false);
        if (activeFolder === renameTarget) setActiveFolder(null);
        refresh();
      }},
    ]);
  }, [renameTarget, activeFolder, refresh]);

  const handleMove = useCallback(async (folder: string | null) => {
    if (!moveTarget) return;
    await moveSentenceToFolder(moveTarget.id, folder);
    setShowMoveMenu(false);
    setMoveTarget(null);
    refresh();
  }, [moveTarget, refresh]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const renderItem = useCallback(({ item }: { item: Sentence }) => (
    <Pressable
      onLongPress={() => handleLongPress(item)}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <View style={styles.itemContent}>
        <Text style={styles.itemText} numberOfLines={1}>{item.text}</Text>
        <Text style={styles.itemTranslation} numberOfLines={1}>{item.translation}</Text>
      </View>
      <View style={styles.itemRight}>
        {item.mastered && <Text style={styles.masteredStar}>⭐</Text>}
        <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </Pressable>
  ), [handleLongPress]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onOpenSettings} style={styles.headerBtn}>
          <Text style={styles.headerIcon}>{'⚙️'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>收藏夹</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setReverseOrder((v) => !v)} style={styles.sortBtn}>
            <Text style={styles.sortBtnText}>{reverseOrder ? '↑' : '↓'}</Text>
          </Pressable>
          <Pressable onPress={() => setShowCreateFolder(true)} style={styles.addFolderBtn}>
            <Text style={styles.addFolderText}>+ 创建收藏夹</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.folderRow}>
        <Pressable
          onPress={() => setActiveFolder(null)}
          style={[styles.folderChip, !activeFolder && styles.folderChipActive]}>
          <Text style={[styles.folderChipText, !activeFolder && styles.folderChipTextActive]}>全部</Text>
        </Pressable>
        {folders.map((f) => (
          <Pressable
            key={f}
            onPress={() => setActiveFolder(f)}
            onLongPress={() => { setRenameTarget(f); setFolderInput(f); setShowRenameFolder(true); }}
            style={[styles.folderChip, activeFolder === f && styles.folderChipActive]}>
            <Text style={[styles.folderChipText, activeFolder === f && styles.folderChipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={filtered()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onScroll={(e) => { scrollPosRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      />

      <Pressable
        onPress={() => onOpenPlayer(activeFolder)}
        style={styles.playerFab}>
        <Text style={styles.playerFabText}>🎧 磨耳朵</Text>
      </Pressable>

      <Modal visible={showCreateFolder} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>创建收藏夹</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="收藏夹名称"
              value={folderInput}
              onChangeText={setFolderInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => { setShowCreateFolder(false); setFolderInput(''); }} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>取消</Text>
              </Pressable>
              <Pressable onPress={handleCreateFolder} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>创建</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showRenameFolder} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>编辑收藏夹</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="新名称"
              value={folderInput}
              onChangeText={setFolderInput}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={handleDeleteFolder} style={[styles.modalCancel, { backgroundColor: Colors.dangerBg }]}>
                <Text style={[styles.modalCancelText, { color: Colors.dangerText }]}>删除</Text>
              </Pressable>
              <Pressable onPress={() => { setShowRenameFolder(false); setFolderInput(''); setRenameTarget(null); }} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>取消</Text>
              </Pressable>
              <Pressable onPress={handleRenameFolder} style={styles.modalConfirm}>
                <Text style={styles.modalConfirmText}>保存</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showMenu && !!menuTarget} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{menuTarget?.text.slice(0, 30)}</Text>
            <Pressable onPress={() => { setShowMenu(false); setMoveTarget(menuTarget); setShowMoveMenu(true); }} style={styles.menuItem}>
              <Text style={styles.menuItemText}>移动到收藏夹</Text>
            </Pressable>
            <Pressable onPress={async () => { if (menuTarget) { await toggleMastered(menuTarget.id); setShowMenu(false); refresh(); } }} style={styles.menuItem}>
              <Text style={styles.menuItemText}>标记{menuTarget?.mastered ? '未掌握' : '已掌握'}</Text>
            </Pressable>
            <Pressable onPress={() => {
              if (menuTarget) {
                Alert.alert('删除确认', `确定删除？`, [
                  { text: '取消', style: 'cancel' },
                  { text: '删除', style: 'destructive', onPress: async () => { await deleteSentence(menuTarget.id); setShowMenu(false); refresh(); } },
                ]);
              }
            }} style={styles.menuItem}>
              <Text style={[styles.menuItemText, { color: Colors.dangerText }]}>删除</Text>
            </Pressable>
            <Pressable onPress={() => setShowMenu(false)} style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.menuItemText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showMoveMenu && !!moveTarget} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>移动到</Text>
            <Pressable onPress={() => handleMove(null)} style={styles.menuItem}>
              <Text style={styles.menuItemText}>未分类</Text>
            </Pressable>
            {folders.map((f) => (
              <Pressable key={f} onPress={() => handleMove(f)} style={styles.menuItem}>
                <Text style={styles.menuItemText}>{f}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowMoveMenu(false)} style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.menuItemText}>取消</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
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
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.headerBorder,
    backgroundColor: Colors.headerBg,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: Colors.headerTitle },
  headerBtn: { padding: 4 },
  headerIcon: { fontSize: 22, color: Colors.headerIcon },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.sortBtnBg, justifyContent: 'center', alignItems: 'center' },
  sortBtnText: { fontSize: 16, color: Colors.sortBtnText, fontWeight: '600' },
  addFolderBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.addFolderBg, borderRadius: 24 },
  addFolderText: { fontSize: 14, color: Colors.addFolderText, fontWeight: '600' },
  folderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexWrap: 'wrap' },
  folderChip: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: Colors.folderChipBg, borderRadius: 16 },
  folderChipActive: { backgroundColor: Colors.folderChipActiveBg },
  folderChipText: { fontSize: 13, color: Colors.folderChipText },
  folderChipTextActive: { color: Colors.folderChipActiveText },
  listContent: { padding: 16, paddingBottom: 80 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.itemBorder,
  },
  itemPressed: { backgroundColor: Colors.itemPressed },
  itemContent: { flex: 1, marginRight: 12 },
  itemText: { fontSize: 16, fontWeight: '600', color: Colors.itemText },
  itemTranslation: { fontSize: 13, color: Colors.itemTranslation, marginTop: 3 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  masteredStar: { fontSize: 14 },
  itemDate: { fontSize: 12, color: Colors.itemDate },
  playerFab: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: Colors.playerFab,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  playerFabText: { color: Colors.playerFabText, fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.modalBg, borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.modalTitle, marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: Colors.modalInputBorder, borderRadius: 12, padding: 12, fontSize: 15, color: Colors.modalInputText, marginBottom: 16, backgroundColor: Colors.modalInputBg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24, backgroundColor: Colors.modalCancelBg },
  modalCancelText: { fontSize: 14, color: Colors.modalCancelText, fontWeight: '600' },
  modalConfirm: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24, backgroundColor: Colors.modalConfirmBg },
  modalConfirmText: { fontSize: 14, color: Colors.modalConfirmText, fontWeight: '600' },
  menuItem: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  menuItemText: { fontSize: 16, color: Colors.textPrimary, textAlign: 'center' },
});