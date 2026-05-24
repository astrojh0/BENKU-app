/**
 * 高级毛玻璃 UI 设计系统 - Glassmorphism Pro
 * 
 * 设计原则：
 * - 毛玻璃质感（通过半透明 + 渐变 + 阴影模拟）
 * - 高级悬停动效
 * - 专业简约
 * - 深色主题 + 微妙光泽
 * 
 * 色彩系统采用 OKLCH 模式，确保一致性和可访问性
 */

export const GlassColors = {
  // 深色主题基础色
  deepBg: '#0a0a0f',
  deepSurface: '#131318',
  deepCard: '#1a1a22',
  
  // 毛玻璃专用色
  glassPrimary: 'rgba(255, 255, 255, 0.08)',
  glassSecondary: 'rgba(255, 255, 255, 0.05)',
  glassHighlight: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBorderLight: 'rgba(255, 255, 255, 0.15)',
  
  // 强调色
  accent: '#6366f1',      // Indigo
  accentGlow: 'rgba(99, 102, 241, 0.3)',
  accentSubtle: 'rgba(99, 102, 241, 0.1)',
  
  // 文字色
  textPrimary: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
  
  // 功能色
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  
  // 光效
  glowWhite: 'rgba(255, 255, 255, 0.1)',
  glowAccent: 'rgba(99, 102, 241, 0.4)',
};

export const GlassSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const GlassRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const GlassShadows = {
  // 基础阴影
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  // 发光效果
  glow: {
    shadowColor: GlassColors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  glowWhite: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
};

export const GlassTypography = {
  display: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
};

export const GlassAnimation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
    verySlow: 600,
  },
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.5, 1.5, 0.5, 1)',
  },
};

export const GlassStyles = {
  // 毛玻璃卡片基础样式
  glassCard: {
    backgroundColor: GlassColors.glassPrimary,
    borderRadius: GlassRadius.lg,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    padding: GlassSpacing.lg,
    ...GlassShadows.md,
  },
  
  // 毛玻璃卡片 - 高级版（带微光）
  glassCardAdvanced: {
    backgroundColor: GlassColors.glassPrimary,
    borderRadius: GlassRadius.lg,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    padding: GlassSpacing.lg,
    overflow: 'hidden' as const,
    ...GlassShadows.lg,
  },
  
  // 毛玻璃按钮
  glassButton: {
    backgroundColor: GlassColors.glassSecondary,
    borderRadius: GlassRadius.md,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    paddingVertical: GlassSpacing.md,
    paddingHorizontal: GlassSpacing.lg,
    ...GlassShadows.sm,
  },
  
  // 毛玻璃输入框
  glassInput: {
    backgroundColor: GlassColors.glassSecondary,
    borderRadius: GlassRadius.full,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    paddingVertical: GlassSpacing.md,
    paddingHorizontal: GlassSpacing.xl,
    ...GlassShadows.sm,
  },
  
  // 毛玻璃导航栏
  glassNav: {
    backgroundColor: GlassColors.glassPrimary,
    borderBottomWidth: 1,
    borderBottomColor: GlassColors.glassBorder,
    backdropFilter: 'blur(20px)' as const,
  },
  
  // 毛玻璃底部栏
  glassBottomBar: {
    backgroundColor: GlassColors.glassPrimary,
    borderTopWidth: 1,
    borderTopColor: GlassColors.glassBorder,
    backdropFilter: 'blur(20px)' as const,
  },
};

export const GlassComponents = {
  // 带光效的毛玻璃卡片
  GlassCard: {
    base: {
      backgroundColor: GlassColors.glassPrimary,
      borderRadius: GlassRadius.lg,
      borderWidth: 1,
      borderColor: GlassColors.glassBorder,
      padding: GlassSpacing.lg,
      ...GlassShadows.md,
    },
    hover: {
      backgroundColor: GlassColors.glassHighlight,
      borderColor: GlassColors.glassBorderLight,
      transform: [{ scale: 1.02 }],
      ...GlassShadows.lg,
    },
    active: {
      backgroundColor: GlassColors.glassSecondary,
      transform: [{ scale: 0.98 }],
    },
  },
  
  // 毛玻璃按钮
  GlassButton: {
    base: {
      backgroundColor: GlassColors.glassSecondary,
      borderRadius: GlassRadius.md,
      borderWidth: 1,
      borderColor: GlassColors.glassBorder,
      paddingVertical: GlassSpacing.md,
      paddingHorizontal: GlassSpacing.lg,
      ...GlassShadows.sm,
    },
    hover: {
      backgroundColor: GlassColors.glassHighlight,
      borderColor: GlassColors.glassBorderLight,
      ...GlassShadows.md,
    },
    active: {
      backgroundColor: GlassColors.glassPrimary,
      transform: [{ scale: 0.95 }],
    },
    disabled: {
      opacity: 0.5,
    },
    primary: {
      backgroundColor: GlassColors.accent,
      borderColor: GlassColors.accent,
    },
    primaryHover: {
      backgroundColor: GlassColors.accent,
      boxShadow: `0 0 20px ${GlassColors.accentGlow}`,
    },
  },
  
  // 毛玻璃输入框
  GlassInput: {
    base: {
      backgroundColor: GlassColors.glassSecondary,
      borderRadius: GlassRadius.full,
      borderWidth: 1,
      borderColor: GlassColors.glassBorder,
      paddingVertical: GlassSpacing.md,
      paddingHorizontal: GlassSpacing.xl,
      color: GlassColors.textPrimary,
      fontSize: GlassTypography.body.fontSize,
      ...GlassShadows.sm,
    },
    focus: {
      borderColor: GlassColors.accent,
      boxShadow: `0 0 0 3px ${GlassColors.accentSubtle}`,
    },
  },
};

export const GlassMotion = {
  // 悬停动效
  hoverLift: {
    transform: [{ scale: 1.02 }],
    transition: {
      duration: GlassAnimation.duration.fast,
      easing: GlassAnimation.easing.smooth,
    },
  },
  
  hoverGlow: {
    shadowOpacity: 0.5,
    shadowRadius: 20,
    transition: {
      duration: GlassAnimation.duration.normal,
      easing: GlassAnimation.easing.smooth,
    },
  },
  
  // 点击动效
  pressScale: {
    transform: [{ scale: 0.95 }],
    transition: {
      duration: GlassAnimation.duration.fast,
      easing: GlassAnimation.easing.smooth,
    },
  },
  
  // 聚焦动效
  focusRing: {
    borderColor: GlassColors.accent,
    boxShadow: `0 0 0 3px ${GlassColors.accentSubtle}`,
    transition: {
      duration: GlassAnimation.duration.fast,
    },
  },
  
  // 入场动效
  fadeIn: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    transition: {
      duration: GlassAnimation.duration.slow,
      easing: GlassAnimation.easing.smooth,
    },
  },
  
  // 滑入动效
  slideUp: {
    opacity: 0,
    transform: [{ translateY: 20 }],
  },
};
