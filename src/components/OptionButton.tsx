import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useTheme, borderRadius, spacing, fontSize, shadow, AppTheme } from '../theme/colors';

interface OptionButtonProps {
  label: string; // A, B, C, D, E
  text: string;
  isSelected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  text,
  isSelected,
  onPress,
  disabled = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colors = useTheme();

  const handlePress = () => {
    if (disabled) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 400,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const s = getStyles(colors, isSelected);

  return (
    <Animated.View style={[s.outer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled}
        style={s.container}
      >
        <View style={s.labelBadge}>
          <Text style={s.labelText}>{label}</Text>
        </View>
        <Text style={s.optionText}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const getStyles = (colors: AppTheme, isSelected: boolean) => StyleSheet.create({
  outer: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    ...shadow(isSelected ? 3 : 1, colors.primary),
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isSelected ? colors.primary : colors.surface,
    borderWidth: 1.5,
    borderColor: isSelected ? colors.primary : colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg - 2,
    paddingHorizontal: spacing.lg,
  },
  labelBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: isSelected ? colors.surface : colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: isSelected ? colors.borderLight : 'transparent',
  },
  labelText: {
    color: isSelected ? colors.primary : colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: '800',
  },
  optionText: {
    flex: 1,
    color: isSelected ? colors.textInverse : colors.textSecondary,
    fontSize: fontSize.md - 1,
    lineHeight: 22,
    fontWeight: isSelected ? '700' : '500',
  },
});
