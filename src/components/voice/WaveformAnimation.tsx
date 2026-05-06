import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

const BAR_COUNT = 5;
const BAR_WIDTH = 4;
const BAR_MARGIN = 4;
const MIN_HEIGHT = 16;
const MAX_HEIGHT = 64;
const DURATION = 400;

export function WaveformAnimation() {
  return (
    <View style={styles.container}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <Bar delay={i * 80} key={i} />
      ))}
    </View>
  );
}

function Bar(props: { delay: number }) {
  const { delay } = props;
  const height = useSharedValue(MIN_HEIGHT);

  useEffect(() => {
    height.set(
      withDelay(
        delay,
        withRepeat(withTiming(MAX_HEIGHT, { duration: DURATION }), -1, true),
      ),
    );
  }, [delay, height]);

  const style = useAnimatedStyle(() => ({
    height: height.get(),
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginHorizontal: BAR_MARGIN / 2,
    width: BAR_WIDTH,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    height: MAX_HEIGHT,
    justifyContent: 'center',
  },
});
