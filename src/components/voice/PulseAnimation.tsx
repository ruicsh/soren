import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/theme';

const SIZE = 80;

export function PulseAnimation() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.set(withRepeat(withSpring(1.3, { damping: 4 }), -1, true));
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.accent,
    borderRadius: SIZE / 2,
    height: SIZE,
    opacity: 0.3,
    width: SIZE,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
