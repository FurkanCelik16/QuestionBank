import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';

interface TopicCheckboxProps {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
  category: 'tarih' | 'cografya' | 'vatandaslik' | 'guncel';
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
        toValue: 0.97,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  const s = getStyles(colors, isSelected);

  return (
    <Animated.View style={[s.outer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={s.container}
      >
        {/* Content */}
        <View style={s.content}>
          <Text style={s.label} numberOfLines={2}>{label}</Text>
        </View>

        {/* Minimal Toggle indicator */}
        <Animated.View
          style={[
            s.toggle,
            {
              transform: [{
                scale: checkAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1],
                }),
              }],
            },
          ]}
        >
          {isSelected && <Text style={s.checkmark}>✓</Text>}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: AppTheme, isSelected: boolean) => StyleSheet.create({
  outer: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadow(isSelected ? 2 : 0.5, colors.primary),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: isSelected ? colors.primary : colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
  },
  label: {
    color: isSelected ? colors.textPrimary : colors.textSecondary,
    fontSize: fontSize.sm + 1,
    fontWeight: isSelected ? '800' : '600',
    lineHeight: 20,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: isSelected ? colors.primary : colors.borderLight,
    backgroundColor: isSelected ? colors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '900',
  },
});
