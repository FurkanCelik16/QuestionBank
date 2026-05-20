import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ImageBackground, Text } from 'react-native';
import { useTheme, borderRadius, spacing } from '../../theme/colors';
import { worldCountries } from '../../data/worldCountries';

interface WorldMapSvgProps {
  highlightedCountryId?: string; // ISO Code
}

export const WorldMapSvg: React.FC<WorldMapSvgProps> = ({ highlightedCountryId }) => {
  const colors = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  
  const country = worldCountries.find(c => c.id === highlightedCountryId);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../../assets/world_map.png')} 
        style={styles.mapImage}
        resizeMode="contain"
      >
        {country && (
          <Animated.View 
            style={[
              styles.highlightNode, 
              { 
                backgroundColor: colors.success,
                left: `${country.x}%`,
                top: `${country.y}%`,
                opacity: pulseAnim,
                transform: [
                  { scale: pulseAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0.8, 1.5] }) },
                  { translateX: -8 },
                  { translateY: -8 },
                ]
              }
            ]} 
          />
        )}
      </ImageBackground>

      <View style={[styles.labelContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.labelText, { color: colors.textSecondary }]}>
          {country ? 'Hedef ülke işaretlendi' : 'Harita Yükleniyor...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: '100%',
    aspectRatio: 1.8,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  highlightNode: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  labelContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  }
});
