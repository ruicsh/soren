import { ArrowUp } from 'lucide-react-native';
import { Pressable } from 'react-native';

const BTN_SIZE = 32;

interface SendButtonProps {
  onPress: () => void;
}

export function SendButton({ onPress }: SendButtonProps) {
  return (
    <Pressable
      hitSlop={16}
      onPress={onPress}
      style={{
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: BTN_SIZE / 2,
        height: BTN_SIZE,
        justifyContent: 'center',
        width: BTN_SIZE,
      }}
      testID="send-button"
    >
      <ArrowUp color="white" size={18} strokeWidth={2.5} />
    </Pressable>
  );
}
