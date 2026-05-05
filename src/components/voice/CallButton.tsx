import { PhoneOff } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius } from '@/theme';

interface CallButtonProps {
  onPress: () => void;
}

export function CallButton({ onPress }: CallButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button} testID="call-button">
      <PhoneOff color="#ffffff" pointerEvents="none" size={32} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: radius.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
});
