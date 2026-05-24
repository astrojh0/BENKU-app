import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { GlassmorphismHomeScreen } from './screens/GlassmorphismHomeScreen';
import { GlassColors, GlassSpacing, GlassRadius } from '../src/theme/advanced-glassmorphism';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GlassPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Pressable
        style={[styles.backButton, { top: insets.top + 16 }]}
        onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← 返回</Text>
      </Pressable>
      
      <GlassmorphismHomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlassColors.deepBg,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    backgroundColor: GlassColors.glassPrimary,
    borderWidth: 1,
    borderColor: GlassColors.glassBorder,
    borderRadius: GlassRadius.md,
    paddingVertical: GlassSpacing.sm,
    paddingHorizontal: GlassSpacing.md,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlassColors.textPrimary,
  },
});
