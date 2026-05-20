import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { useTheme, borderRadius, spacing, fontSize } from '../theme/colors';

interface MapOptionButtonProps {
  label: string; // A, B, C, D
  text: string;  // İl/Ülke adı
  onPress: () => void;
  status: 'idle' | 'correct' | 'wrong'; // Cevap durumu
  disabled?: boolean;
}

export const MapOptionButton: React.FC<MapOptionButtonProps> = ({
  label,
  text,
  onPress,
  status,
  disabled = false,
}) => {
  const colors = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  let backgroundColor = colors.surface;
  let borderColor = colors.border;
  let textColor = colors.textPrimary;

  if (status === 'correct') {
    backgroundColor = colors.successGlow;
    borderColor = colors.success;
    textColor = colors.success;
  } else if (status === 'wrong') {
    backgroundColor = colors.errorGlow;
    borderColor = colors.error;
    textColor = colors.error;
  } else if (disabled && status === 'idle') {
    // Other options when one is selected
    backgroundColor = colors.surface;
    borderColor = colors.border;
    textColor = colors.textMuted;
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[styles.container, { backgroundColor, borderColor }]}
      >
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  label: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    marginRight: spacing.md,
    width: 24,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
});
