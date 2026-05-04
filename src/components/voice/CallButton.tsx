import { PhoneOff } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { colors } from '@/theme';

interface CallButtonProps {
  onPress: () => void;
}

export function CallButton({ onPress }: CallButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.button}
      testID="call-button"
    >
      <PhoneOff color="white" pointerEvents="none" size={32} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 9999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
});
