import { Pressable } from 'react-native';

import { Mic } from 'lucide-react-native';

const BTN_SIZE = 32;

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function MicButton({ isRecording, onPress }: MicButtonProps) {
  return (
    <Pressable
      testID="mic-button"
      onPress={onPress}
      hitSlop={16}
      style={{
        width: BTN_SIZE,
        height: BTN_SIZE,
        borderRadius: BTN_SIZE / 2,
        backgroundColor: isRecording ? '#007AFF' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Mic
        size={20}
        color={isRecording ? 'white' : '#8E8E93'}
        strokeWidth={2}
      />
    </Pressable>
  );
}
