import React from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors } from '../../src/theme';

export interface HistoryItem {
  id: string;
  title: string;
  createdAt: number;
}

interface HistoryModalProps {
  visible: boolean;
  items: HistoryItem[];
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

export default function HistoryModal({ visible, items, onClose, onSelect }: HistoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.popover}>
          <Text style={styles.title}>讯息目录</Text>
          <View style={styles.divider} />
          {items.length === 0 ? (
            <Text style={styles.empty}>暂无历史对话</Text>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.item}
                  onPress={() => onSelect(item)}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  popover: {
    width: 280,
    maxHeight: 400,
    backgroundColor: Colors.modalBg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.historyTitle,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  empty: {
    fontSize: 14,
    color: Colors.historyEmpty,
    textAlign: 'center',
    paddingVertical: 32,
  },
  item: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 15,
    color: Colors.historyItemText,
    flex: 1,
    marginRight: 12,
  },
  itemDate: {
    fontSize: 13,
    color: Colors.historyItemDate,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.historySeparator,
    marginLeft: 16,
  },
});