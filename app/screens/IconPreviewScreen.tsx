import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICONS = [
  {
    id: 'modern',
    name: '现代简约风',
    description: '扁平渐变 · 科技感',
    gradient: ['#667eea', '#764ba2'],
    icon: '📱',
    letter: 'B',
  },
  {
    id: 'colorful',
    name: '活泼彩色风',
    description: '彩虹渐变 · 年轻活力',
    gradient: ['#f093fb', '#f5576c'],
    icon: '🌈',
    letter: 'K',
  },
  {
    id: 'professional',
    name: '专业商务风',
    description: '几何线条 · 高端专业',
    gradient: ['#4facfe', '#00f2fe'],
    icon: '💼',
    letter: 'B',
  },
  {
    id: 'minimal',
    name: '极简主义风',
    description: '负空间 · 简约时尚',
    gradient: ['#43e97b', '#38f9d7'],
    icon: '✨',
    letter: 'B',
  },
  {
    id: 'cute',
    name: '可爱萌系风',
    description: '柔和粉色 · 温暖治愈',
    gradient: ['#fa709a', '#fee140'],
    icon: '🌸',
    letter: 'K',
  },
  {
    id: 'futuristic',
    name: '未来科技风',
    description: '3D 效果 · AI 智能感',
    gradient: ['#a18cd1', '#fbc2eb'],
    icon: '🚀',
    letter: 'B',
  },
];

export default function IconPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 返回</Text>
        </Pressable>
        <Text style={styles.headerTitle}>图标预览</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎨 Benku 图标设计</Text>
          <Text style={styles.infoText}>
            选择喜欢的图标风格，点击保存到相册
          </Text>
        </View>

        <View style={styles.grid}>
          {ICONS.map((icon, index) => (
            <View key={icon.id} style={styles.iconCard}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: icon.gradient[0],
                  },
                ]}>
                <Text style={styles.iconLetter}>{icon.letter}</Text>
                <View style={styles.iconOverlay}>
                  <Text style={styles.iconEmoji}>{icon.icon}</Text>
                </View>
              </View>
              <Text style={styles.iconName}>{icon.name}</Text>
              <Text style={styles.iconDesc}>{icon.description}</Text>
              <Pressable style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>💾 保存</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            📐 尺寸: 512×512 PNG{'\n'}
            ✨ 6 种风格可选{'\n'}
            🎨 支持透明背景
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
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
  backBtn: {
    width: 60,
    height: 40,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    color: Colors.headerIcon,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.headerTitle,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.headerBorder,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  grid: {
    gap: 16,
  },
  iconCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.headerBorder,
    marginBottom: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconLetter: {
    fontSize: 56,
    fontWeight: '900',
    color: 'white',
    position: 'absolute',
  },
  iconOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  iconEmoji: {
    fontSize: 20,
  },
  iconName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  iconDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: Colors.quickBtnActiveBg,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.quickBtnActiveText,
  },
  footer: {
    marginTop: 24,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.headerBorder,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
});
