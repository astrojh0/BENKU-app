import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  TextInput,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  GlassColors,
  GlassSpacing,
  GlassRadius,
  GlassShadows,
  GlassTypography,
  GlassAnimation,
} from '../theme/advanced-glassmorphism';

interface GlassCardProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'glow';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  title,
  subtitle,
  style,
  onPress,
  variant = 'default',
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: GlassAnimation.duration.slow,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
    
    if (variant === 'glow') {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: GlassAnimation.duration.fast,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
      tension: 40,
    }).start();
    
    if (variant === 'glow') {
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: GlassAnimation.duration.normal,
        useNativeDriver: false,
      }).start();
    }
  };

  const cardStyle = [
    styles.card,
    variant === 'elevated' && styles.cardElevated,
    variant === 'glow' && styles.cardGlow,
    {
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim,
      shadowOpacity: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.25, 0.5],
      }),
      shadowRadius: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 25],
      }),
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}>
        <Animated.View style={cardStyle}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Animated.View style={cardStyle}>
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {children}
    </Animated.View>
  );
};

interface GlassButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
    
    if (variant === 'primary') {
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: GlassAnimation.duration.fast,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
    
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: GlassAnimation.duration.normal,
      useNativeDriver: false,
    }).start();
  };

  const sizeStyles = {
    small: { paddingVertical: GlassSpacing.sm, paddingHorizontal: GlassSpacing.md },
    medium: { paddingVertical: GlassSpacing.md, paddingHorizontal: GlassSpacing.lg },
    large: { paddingVertical: GlassSpacing.lg, paddingHorizontal: GlassSpacing.xl },
  };

  const buttonStyle = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'ghost' && styles.buttonGhost,
    sizeStyles[size],
    disabled && styles.buttonDisabled,
    {
      transform: [{ scale: scaleAnim }],
      shadowOpacity: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
      }),
    },
    style,
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'ghost' && styles.buttonTextGhost,
    size === 'small' && styles.buttonTextSmall,
    size === 'large' && styles.buttonTextLarge,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
      <Animated.View style={buttonStyle}>
        <Text style={textStyle}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

interface GlassInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  style,
  inputStyle,
}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: GlassAnimation.duration.fast,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: GlassAnimation.duration.fast,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GlassColors.glassBorder, GlassColors.accent],
  });

  const shadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.inputContainer,
        {
          borderColor,
          shadowOpacity,
          shadowRadius: borderAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [3, 8],
          }),
        },
        style,
      ]}>
      <TextInput
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={GlassColors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // GlassCard styles
  card: {
    backgroundColor: GlassColors.glassPrimary,
    borderRadius: GlassRadius.lg,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    padding: GlassSpacing.lg,
    ...GlassShadows.md,
  },
  cardElevated: {
    ...GlassShadows.lg,
  },
  cardGlow: {
    shadowColor: GlassColors.accent,
  },
  title: {
    ...GlassTypography.h3,
    color: GlassColors.textPrimary,
    marginBottom: GlassSpacing.xs,
  },
  subtitle: {
    ...GlassTypography.caption,
    color: GlassColors.textSecondary,
    marginBottom: GlassSpacing.md,
  },

  // GlassButton styles
  button: {
    backgroundColor: GlassColors.glassSecondary,
    borderRadius: GlassRadius.md,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...GlassShadows.sm,
  },
  buttonPrimary: {
    backgroundColor: GlassColors.accent,
    borderColor: GlassColors.accent,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...GlassTypography.body,
    fontWeight: '600',
    color: GlassColors.textPrimary,
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextGhost: {
    color: GlassColors.accent,
  },
  buttonTextSmall: {
    fontSize: 13,
  },
  buttonTextLarge: {
    fontSize: 18,
  },

  // GlassInput styles
  inputContainer: {
    backgroundColor: GlassColors.glassSecondary,
    borderRadius: GlassRadius.full,
    borderWidth: 1,
    ...GlassShadows.sm,
  },
  input: {
    ...GlassTypography.body,
    color: GlassColors.textPrimary,
    paddingVertical: GlassSpacing.md,
    paddingHorizontal: GlassSpacing.xl,
  },
});
