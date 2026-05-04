import { Pressable } from 'react-native';

import { ArrowUp } from 'lucide-react-native';

const BTN_SIZE = 32;

interface SendButtonProps {
  onPress: () => void;
}

export function SendButton({ onPress }: SendButtonProps) {
  return (
    <Pressable
      testID="send-button"
      onPress={onPress}
      hitSlop={16}
      style={{
        width: BTN_SIZE,
        height: BTN_SIZE,
        borderRadius: BTN_SIZE / 2,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ArrowUp size={18} color="white" strokeWidth={2.5} />
    </Pressable>
  );
}
