import { Mic } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';

import { BTN_SIZE } from './const';

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function MicButton(props: MicButtonProps) {
  const { isRecording, onPress } = props;

  return (
    <Pressable
      hitSlop={16}
      onPress={onPress}
      style={[styles.button, isRecording && styles.recording]}
      testID="mic-button"
    >
      <Mic
        color={isRecording ? '#ffffff' : colors.text2}
        pointerEvents="none"
        size={20}
        strokeWidth={2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: BTN_SIZE / 2,
    height: BTN_SIZE,
    justifyContent: 'center',
    width: BTN_SIZE,
  },
  recording: {
    backgroundColor: colors.accent,
  },
});
