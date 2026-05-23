import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { NATIVE_LANGUAGES } from '../../src/contexts/LanguageContext';

interface NativeLanguageModalProps {
  visible: boolean;
  onSelect: (code: string) => void;
}

export function NativeLanguageModal({ visible, onSelect }: NativeLanguageModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>请选择你的母语</Text>
          <Text style={styles.subtitle}>这将帮助 AI 更好地理解你的提问</Text>
          
          <View style={styles.langList}>
            {NATIVE_LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={styles.langBtn}
                onPress={() => onSelect(lang.code)}>
                <Text style={styles.langBtnText}>{lang.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  langList: {
    gap: 10,
  },
  langBtn: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  langBtnText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
});
