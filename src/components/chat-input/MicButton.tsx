import { Mic } from 'lucide-react-native';
import { Pressable } from 'react-native';

const BTN_SIZE = 32;

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

export function MicButton({ isRecording, onPress }: MicButtonProps) {
  return (
    <Pressable
      hitSlop={16}
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: isRecording ? '#007AFF' : 'transparent',
        borderRadius: BTN_SIZE / 2,
        height: BTN_SIZE,
        justifyContent: 'center',
        width: BTN_SIZE,
      }}
      testID="mic-button"
    >
      <Mic
        color={isRecording ? 'white' : '#8E8E93'}
        size={20}
        strokeWidth={2}
      />
    </Pressable>
  );
}
