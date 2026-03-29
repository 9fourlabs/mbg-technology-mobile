import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface ThemeProps {
  placeholder?: string;
}

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}

interface SkeletonLineProps {
  width: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
  theme?: ThemeProps;
}

export function SkeletonLine({ width, height = 14, style, theme }: SkeletonLineProps) {
  const opacity = usePulse();
  const backgroundColor = theme?.placeholder ?? '#1a1a1a';

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 4, backgroundColor, opacity },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  height?: number;
  style?: ViewStyle;
  theme?: ThemeProps;
}

export function SkeletonCard({ height = 120, style, theme }: SkeletonCardProps) {
  const opacity = usePulse();
  const backgroundColor = theme?.placeholder ?? '#1a1a1a';

  return (
    <Animated.View
      style={[
        { width: '100%', height, borderRadius: 12, backgroundColor, opacity },
        style,
      ]}
    />
  );
}

interface SkeletonAvatarProps {
  size?: number;
  style?: ViewStyle;
  theme?: ThemeProps;
}

export function SkeletonAvatar({ size = 40, style, theme }: SkeletonAvatarProps) {
  const opacity = usePulse();
  const backgroundColor = theme?.placeholder ?? '#1a1a1a';

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonListProps {
  count?: number;
  theme?: ThemeProps;
}

export function SkeletonList({ count = 3, theme }: SkeletonListProps) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonAvatar theme={theme} />
          <View style={styles.lines}>
            <SkeletonLine width="60%" theme={theme} />
            <SkeletonLine width="40%" height={12} theme={theme} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lines: {
    flex: 1,
    marginLeft: 12,
    gap: 8,
  },
});
