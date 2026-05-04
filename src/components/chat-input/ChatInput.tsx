import { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  type TextInputContentSizeChangeEvent,
} from 'react-native';

import { useDictation } from '@/hooks/use-dictation';
import { TextInput, View } from '@/tw';
import { MicButton } from './MicButton';
import { SendButton } from './SendButton';

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
  const { isRecording, transcript, startDictation, stopDictation } =
    useDictation();
  const pendingSendRef = useRef(false);

  const maxHeight = screenHeight * 0.5;
  const isAtMax = contentHeight !== undefined && contentHeight >= maxHeight;

  // Track when a dictation session starts so we know to send once it ends
  useEffect(() => {
    if (isRecording) {
      pendingSendRef.current = true;
    }
  }, [isRecording]);

  // Auto-send exactly once when a dictation session ends with a transcript
  useEffect(() => {
    if (!isRecording && pendingSendRef.current && transcript.trim()) {
      const trimmed = transcript.trim();
      pendingSendRef.current = false;
      onSend(trimmed);
    }
  }, [isRecording, transcript, onSend]);

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

  const handleMicPress = () => {
    if (isRecording) {
      stopDictation();
    } else {
      startDictation();
    }
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
        placeholder={isRecording ? 'Listening…' : placeholder}
        scrollEnabled={isAtMax}
        style={{
          height: isAtMax ? maxHeight : undefined,
          maxHeight,
        }}
        value={text}
      />
      {hasText && !isRecording && <SendButton onPress={handleSend} />}
      {(!hasText || isRecording) && (
        <MicButton isRecording={isRecording} onPress={handleMicPress} />
      )}
    </View>
  );
}
