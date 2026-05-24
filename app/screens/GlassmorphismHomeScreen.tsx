import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/GlassComponents';
import {
  GlassColors,
  GlassSpacing,
  GlassRadius,
  GlassTypography,
  GlassAnimation,
} from '../theme/advanced-glassmorphism';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: string;
}

const FEATURES: Feature[] = [
  {
    id: 1,
    title: '智能识别',
    description: '拍照即可识别文字',
    icon: '📷',
  },
  {
    id: 2,
    title: '语音朗读',
    description: '标准发音示范',
    icon: '🔊',
  },
  {
    id: 3,
    title: '收藏学习',
    description: '建立个人词库',
    icon: '📚',
  },
  {
    id: 4,
    title: '智能翻译',
    description: '多语言支持',
    icon: '🌐',
  },
];

export const GlassmorphismHomeScreen: React.FC = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: GlassAnimation.duration.slow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: GlassAnimation.duration.slow,
        useNativeDriver: true,
      }),
    ]).start();

    const glowPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    glowPulse.start();

    return () => glowPulse.stop();
  }, []);

  const heroGlowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  return (
    <View style={styles.container}>
      {/* 背景渐变 */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientOverlay} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        
        {/* 顶部导航 */}
        <Animated.View
          style={[
            styles.navBar,
            {
              opacity: fadeAnim,
            },
          ]}>
          <GlassCard style={styles.navCard}>
            <View style={styles.navContent}>
              <Text style={styles.navLogo}>BENKU</Text>
              <View style={styles.navActions}>
                <GlassButton
                  title="设置"
                  size="small"
                  variant="ghost"
                  onPress={() => {}}
                />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Hero 区域 */}
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <View style={styles.heroGlowContainer}>
            <Animated.View
              style={[
                styles.heroGlow,
                { opacity: heroGlowOpacity },
              ]}
            />
          </View>
          
          <GlassCard variant="glow" style={styles.heroCard}>
            <Text style={styles.heroTitle}>智能语言学习助手</Text>
            <Text style={styles.heroSubtitle}>
              拍照识别 · 语音朗读 · 智能翻译
            </Text>
            
            <View style={styles.searchContainer}>
              <GlassInput
                placeholder="输入你想学习的句子或单词..."
                style={styles.searchInput}
              />
            </View>
            
            <GlassButton
              title="开始学习"
              variant="primary"
              size="large"
              style={styles.heroButton}
              onPress={() => {}}
            />
          </GlassCard>
        </Animated.View>

        {/* 功能卡片网格 */}
        <Animated.View
          style={[
            styles.featuresSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <Text style={styles.sectionTitle}>核心功能</Text>
          
          <View style={styles.featuresGrid}>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.id}
                style={[
                  styles.featureItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [-50, 50],
                          outputRange: [25, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <GlassCard
                  variant="elevated"
                  onPress={() => {}}
                  style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </GlassCard>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* 统计卡片 */}
        <Animated.View
          style={[
            styles.statsSection,
            {
              opacity: fadeAnim,
            },
          ]}>
          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1,234</Text>
                <Text style={styles.statLabel}>已学习</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>56</Text>
                <Text style={styles.statLabel}>收藏</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>天连续</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 推荐内容 */}
        <Animated.View
          style={[
            styles.recommendSection,
            {
              opacity: fadeAnim,
            },
          ]}>
          <Text style={styles.sectionTitle}>推荐学习</Text>
          
          <GlassCard style={styles.recommendCard}>
            <View style={styles.recommendHeader}>
              <Text style={styles.recommendTag}>日语</Text>
              <Text style={styles.recommendDate}>今天</Text>
            </View>
            <Text style={styles.recommendSentence}>
              こんにちは、元気ですか？
            </Text>
            <Text style={styles.recommendTranslation}>
              你好，你好吗？
            </Text>
            <View style={styles.recommendActions}>
              <GlassButton
                title="朗读"
                size="small"
                variant="default"
                onPress={() => {}}
              />
              <GlassButton
                title="收藏"
                size="small"
                variant="ghost"
                onPress={() => {}}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* 底部间距 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassColors.deepBg,
  },
  
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GlassColors.deepBg,
  },
  
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: GlassSpacing.xxxl,
  },
  
  // Navigation
  navBar: {
    paddingHorizontal: GlassSpacing.lg,
    paddingTop: GlassSpacing.xl,
    paddingBottom: GlassSpacing.md,
  },
  
  navCard: {
    padding: GlassSpacing.md,
  },
  
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  navLogo: {
    ...GlassTypography.h2,
    color: GlassColors.textPrimary,
    fontWeight: '700',
  },
  
  navActions: {
    flexDirection: 'row',
    gap: GlassSpacing.sm,
  },
  
  // Hero Section
  heroSection: {
    paddingHorizontal: GlassSpacing.lg,
    marginTop: GlassSpacing.lg,
    position: 'relative',
  },
  
  heroGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    top: -50,
    height: 300,
  },
  
  heroGlow: {
    width: SCREEN_WIDTH * 0.8,
    height: 200,
    borderRadius: 100,
    backgroundColor: GlassColors.accent,
    opacity: 0.2,
  },
  
  heroCard: {
    alignItems: 'center',
    paddingVertical: GlassSpacing.xxl,
  },
  
  heroTitle: {
    ...GlassTypography.display,
    color: GlassColors.textPrimary,
    textAlign: 'center',
    marginBottom: GlassSpacing.sm,
  },
  
  heroSubtitle: {
    ...GlassTypography.body,
    color: GlassColors.textSecondary,
    textAlign: 'center',
    marginBottom: GlassSpacing.xl,
  },
  
  searchContainer: {
    width: '100%',
    marginBottom: GlassSpacing.lg,
  },
  
  searchInput: {
    width: '100%',
  },
  
  heroButton: {
    width: '100%',
    marginTop: GlassSpacing.md,
  },
  
  // Features Section
  featuresSection: {
    paddingHorizontal: GlassSpacing.lg,
    marginTop: GlassSpacing.xxl,
  },
  
  sectionTitle: {
    ...GlassTypography.h2,
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.lg,
  },
  
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GlassSpacing.md,
  },
  
  featureItem: {
    width: (SCREEN_WIDTH - GlassSpacing.lg * 2 - GlassSpacing.md) / 2,
  },
  
  featureCard: {
    alignItems: 'center',
    padding: GlassSpacing.lg,
  },
  
  featureIcon: {
    fontSize: 32,
    marginBottom: GlassSpacing.sm,
  },
  
  featureTitle: {
    ...GlassTypography.body,
    fontWeight: '600',
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.xs,
  },
  
  featureDescription: {
    ...GlassTypography.caption,
    color: GlassColors.textSecondary,
    textAlign: 'center',
  },
  
  // Stats Section
  statsSection: {
    paddingHorizontal: GlassSpacing.lg,
    marginTop: GlassSpacing.xxl,
  },
  
  statsCard: {
    padding: GlassSpacing.lg,
  },
  
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    ...GlassTypography.display,
    color: GlassColors.accent,
    fontSize: 28,
  },
  
  statLabel: {
    ...GlassTypography.caption,
    color: GlassColors.textSecondary,
    marginTop: GlassSpacing.xs,
  },
  
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: GlassColors.glassBorder,
  },
  
  // Recommend Section
  recommendSection: {
    paddingHorizontal: GlassSpacing.lg,
    marginTop: GlassSpacing.xxl,
  },
  
  recommendCard: {
    padding: GlassSpacing.lg,
  },
  
  recommendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: GlassSpacing.md,
  },
  
  recommendTag: {
    ...GlassTypography.caption,
    color: GlassColors.accent,
    fontWeight: '600',
  },
  
  recommendDate: {
    ...GlassTypography.caption,
    color: GlassColors.textMuted,
  },
  
  recommendSentence: {
    ...GlassTypography.h2,
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.sm,
  },
  
  recommendTranslation: {
    ...GlassTypography.body,
    color: GlassColors.textSecondary,
    marginBottom: GlassSpacing.lg,
  },
  
  recommendActions: {
    flexDirection: 'row',
    gap: GlassSpacing.md,
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: GlassSpacing.xxxl,
  },
});
