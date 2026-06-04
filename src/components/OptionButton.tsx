import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';

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
        toValue: 0.97,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 400,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const s = getStyles(colors);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled}
        style={[
          s.container,
          isSelected && s.containerSelected,
        ]}
      >
        <View
          style={[
            s.labelBadge,
            isSelected && s.labelBadgeSelected,
          ]}
        >
          <Text
            style={[
              s.labelText,
              isSelected && s.labelTextSelected,
            ]}
          >
            {label}
          </Text>
        </View>
        <Text
          style={[
            s.optionText,
            isSelected && s.optionTextSelected,
          ]}
        >
          {text}
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
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm + 2,
  },
  containerSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  labelBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  labelBadgeSelected: {
    backgroundColor: colors.primary,
  },
  labelText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  labelTextSelected: {
    color: colors.textInverse,
  },
  optionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  optionTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
