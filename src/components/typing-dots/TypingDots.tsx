import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

const dotBase = {
  backgroundColor: colors.text2,
  borderRadius: radius.full,
  height: 6,
  width: 6,
};

export function TypingDots() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 200);

    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.container}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ ...dotBase, opacity: step === i ? 1 : 0.3 }}
          testID={`typing-dot-${i}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
  },
});
