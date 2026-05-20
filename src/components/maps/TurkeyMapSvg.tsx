import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme, borderRadius, spacing } from '../../theme/colors';
import { turkeyMapPaths } from '../../data/turkeyMapPaths';
import { provinces } from '../../data/turkeyProvinces';

interface TurkeyMapSvgProps {
  highlightedProvinceId?: number; // Plaka kodu
  highlightedProvinceIds?: number[]; // Multiple plaka kodları
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const TurkeyMapSvg: React.FC<TurkeyMapSvgProps> = ({ highlightedProvinceId, highlightedProvinceIds }) => {
  const colors = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const targetPlate = highlightedProvinceId ? String(highlightedProvinceId).padStart(2, '0') : '';
  const targetPlates = highlightedProvinceIds ? highlightedProvinceIds.map(id => String(id).padStart(2, '0')) : [];
  const province = provinces.find(p => p.id === highlightedProvinceId);

  // SVG ViewBox dimensions: 1007.478 x 527.323
  const svgOriginalWidth = 1007.478;
  const svgOriginalHeight = 527.323;
  const mapAspectRatio = svgOriginalWidth / svgOriginalHeight; // ~1.91

  let mapWidth = dimensions.width;
  let mapHeight = mapWidth / mapAspectRatio;

  if (mapHeight > dimensions.height && dimensions.height > 0) {
    mapHeight = dimensions.height;
    mapWidth = mapHeight * mapAspectRatio;
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {dimensions.width > 0 && (
        <View 
          style={[
            styles.mapWrapper, 
            { 
              width: mapWidth, 
              height: mapHeight,
              borderColor: colors.border,
              backgroundColor: colors.background
            }
          ]}
        >
          <Svg
            viewBox={`0 0 ${svgOriginalWidth} ${svgOriginalHeight}`}
            width="100%"
            height="100%"
          >
            {turkeyMapPaths.map((prov) => {
              const isHighlighted = prov.plate === targetPlate || targetPlates.includes(prov.plate);
              const isCyprus = prov.plate === '00';
              
              // dynamic colors
              const fillColor = isHighlighted 
                ? colors.primary 
                : isCyprus 
                  ? colors.surface 
                  : colors.surfaceLight;
                  
              const strokeColor = isHighlighted 
                ? colors.primaryLight 
                : isCyprus 
                  ? colors.border 
                  : colors.border;
                  
              const strokeWidth = isHighlighted ? 2.5 : 0.6;
              
              return prov.paths.map((pathD, idx) => {
                const pathKey = `${prov.id}-${idx}`;
                if (isHighlighted) {
                  return (
                    <AnimatedPath
                      key={pathKey}
                      d={pathD}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      opacity={pulseAnim}
                    />
                  );
                } else {
                  return (
                    <Path
                      key={pathKey}
                      d={pathD}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                  );
                }
              });
            })}
          </Svg>
        </View>
      )}

      <View style={[styles.labelContainer, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]}>
        <Text style={[styles.labelText, { color: colors.textPrimary }]}>
          {province ? 'İşaretli Bölgeyi Tahmin Et' : 'Harita Yükleniyor...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  mapWrapper: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    position: 'relative',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  labelContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
