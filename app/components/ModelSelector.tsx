import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors } from '../../src/theme';

export type ModelType = 'deepseek' | 'openai' | 'gemini';

export interface ModelOption {
  key: ModelType;
  label: string;
  iconUrl: string;
  fallbackIcon: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    key: 'deepseek',
    label: 'DeepSeek',
    iconUrl: 'https://cdn.deepseek.com/logo.png',
    fallbackIcon: 'D',
  },
  {
    key: 'openai',
    label: 'GPT',
    iconUrl: 'https://openai.com/favicon.ico',
    fallbackIcon: 'G',
  },
  {
    key: 'gemini',
    label: 'Gemini',
    iconUrl: 'https://www.gstatic.com/lamda/images/gemini_favicon_v1.png',
    fallbackIcon: 'G',
  },
];

const MODEL_STORAGE_KEY = 'selected_model';

export async function getSelectedModel(): Promise<ModelType> {
  try {
    const val = await AsyncStorage.getItem(MODEL_STORAGE_KEY);
    if (val === 'openai' || val === 'gemini' || val === 'deepseek') return val;
  } catch (e) { /* ignore */ }
  return 'deepseek';
}

export async function setSelectedModel(model: ModelType): Promise<void> {
  await AsyncStorage.setItem(MODEL_STORAGE_KEY, model);
}

interface ModelSelectorProps {
  onModelChange?: (model: ModelType) => void;
}

export default function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [selected, setSelected] = useState<ModelType>('deepseek');
  const [menuVisible, setMenuVisible] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);

  useEffect(() => {
    (async () => {
      const model = await getSelectedModel();
      setSelected(model);
    })();
  }, []);

  const handleSelect = useCallback(async (model: ModelType) => {
    setSelected(model);
    setMenuVisible(false);
    await setSelectedModel(model);
    onModelChange?.(model);
  }, [onModelChange]);

  const handleOpenMenu = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setButtonLayout({ x, y, width, height });
        setMenuVisible(true);
      });
    }
  }, []);

  const currentOption = MODEL_OPTIONS.find((o) => o.key === selected) || MODEL_OPTIONS[0];

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handleOpenMenu}>
        <View ref={buttonRef} style={styles.selector}>
          <ModelIcon option={currentOption} size={20} />
          <Text style={styles.selectorLabel}>{currentOption.label}</Text>
          <Text style={styles.arrow}>▼</Text>
        </View>
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View
            style={[
              styles.menu,
              {
                top: buttonLayout.y + buttonLayout.height + 4,
                left: buttonLayout.x,
                width: Math.max(buttonLayout.width, 140),
              },
            ]}>
            {MODEL_OPTIONS.map((option, index) => {
              const isSelected = option.key === selected;
              return (
                <View key={option.key}>
                  {index > 0 && <View style={styles.menuDivider} />}
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => handleSelect(option.key)}>
                    <ModelIcon option={option} size={20} />
                    <Text style={styles.menuItemLabel}>{option.label}</Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function ModelIcon({ option, size }: { option: ModelOption; size: number }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <View style={[styles.fallbackIcon, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.55 }]}>{option.fallbackIcon}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: option.iconUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setImgError(true)}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: 4,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.selectorBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 36,
    minWidth: 120,
    maxWidth: 200,
    gap: 6,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.selectorText,
  },
  arrow: {
    fontSize: 10,
    color: Colors.selectorArrow,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },
  menu: {
    position: 'absolute',
    backgroundColor: Colors.menuBg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.menuItemText,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    color: Colors.checkmark,
    fontWeight: '600',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.menuDivider,
    marginLeft: 12,
  },
  fallbackIcon: {
    backgroundColor: Colors.fallbackIconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: Colors.fallbackIconText,
    fontWeight: '700',
  },
});