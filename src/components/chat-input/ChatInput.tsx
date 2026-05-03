import { useState } from 'react';
import type { TextInputContentSizeChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { ArrowUp } from 'lucide-react-native';
import { tv } from 'tailwind-variants';

import { Pressable, TextInput, View } from '@/tw';

const sendButtonCx = tv({
  base: 'hidden bg-accent size-8 items-center justify-center rounded-full active:opacity-80',
  variants: {
    hasText: {
      true: 'flex',
    },
  },
});

interface ChatInputProps {
  placeholder?: string;
  onSend: (text: string) => void;
}

export function ChatInput(props: ChatInputProps) {
  const { placeholder = 'Message…', onSend } = props;

  const [text, setText] = useState('');
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined,
  );
  const { height: screenHeight } = useWindowDimensions();

  const maxHeight = screenHeight * 0.5;
  const isAtMax = contentHeight !== undefined && contentHeight >= maxHeight;

  const handleContentSizeChange = (event: TextInputContentSizeChangeEvent) => {
    setContentHeight(event.nativeEvent.contentSize.height);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    setContentHeight(undefined);
  };

  const hasText = text.trim().length > 0;

  return (
    <View className="border-border bg-bg-2 flex-row items-end rounded-3xl border px-4 py-3">
      <TextInput
        className="text-text placeholder:text-text-2 min-h-8 flex-1 pt-0 pb-0 text-xl outline-none"
        multiline
        onChangeText={setText}
        onContentSizeChange={handleContentSizeChange}
        onSubmitEditing={handleSend}
        placeholder={placeholder}
        scrollEnabled={isAtMax}
        style={{
          height: isAtMax ? maxHeight : undefined,
          maxHeight,
        }}
        value={text}
      />
      <Pressable
        testID="send-button"
        onPress={handleSend}
        className={sendButtonCx({ hasText })}
      >
        <ArrowUp size={18} color="white" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
