import { ArrowUp } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';

import { BTN_SIZE } from './const';

interface SendButtonProps {
  onPress: () => void;
}

export function SendButton({ onPress }: SendButtonProps) {
  return (
    <Pressable
      hitSlop={16}
      onPress={onPress}
      style={styles.button}
      testID="send-button"
    >
      <ArrowUp
        color="#ffffff"
        pointerEvents="none"
        size={18}
        strokeWidth={2.5}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: BTN_SIZE / 2,
    height: BTN_SIZE,
    justifyContent: 'center',
    width: BTN_SIZE,
  },
});
