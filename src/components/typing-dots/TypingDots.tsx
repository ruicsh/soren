import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing, radius } from '@/theme';

const dotBase = {
  backgroundColor: colors.text2,
  borderRadius: radius.full,
  width: 6,
  height: 6,
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
          testID={`typing-dot-${i}`}
          key={i}
          style={{ ...dotBase, opacity: step === i ? 1 : 0.3 }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});
