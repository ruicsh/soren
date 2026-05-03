import { useEffect, useState } from 'react';

import { View } from '@/tw';

export function TypingDots() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 200);
    return () => clearInterval(id);
  }, []);

  return (
    <View className="flex-row items-center gap-1">
      {[0, 1, 2].map((i) => (
        <View
          testID={`typing-dot-${i}`}
          key={i}
          className="bg-text-2 rounded-full"
          style={{
            width: 6,
            height: 6,
            opacity: step === i ? 1 : 0.3,
          }}
        />
      ))}
    </View>
  );
}
