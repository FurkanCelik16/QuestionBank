import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';

interface TopicCheckboxProps {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  category: 'tarih' | 'cografya';
}

export const TopicCheckbox: React.FC<TopicCheckboxProps> = ({
  label,
  isSelected,
  onToggle,
  category,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const colors = useTheme();

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: isSelected ? 1 : 0,
      friction: 6,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  const accentColor = category === 'tarih' ? colors.tarih : colors.cografya;
  const glowColor = category === 'tarih' ? colors.tarihGlow : colors.cografyaGlow;

  const s = getStyles(colors);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          s.container,
          isSelected && {
            borderColor: accentColor,
            backgroundColor: glowColor,
          },
        ]}
      >
        <Animated.View
          style={[
            s.checkbox,
            {
              borderColor: isSelected ? accentColor : colors.border,
              backgroundColor: isSelected ? accentColor : 'transparent',
              transform: [
                {
                  scale: checkAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [1, 1.2, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {isSelected && (
            <Text style={s.checkmark}>✓</Text>
          )}
        </Animated.View>
        <Text
          style={[
            s.label,
            isSelected && { color: colors.textPrimary },
          ]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
});
