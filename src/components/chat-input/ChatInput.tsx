import { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  StyleSheet,
  TextInput,
  View,
  type TextInputContentSizeChangeEvent,
} from 'react-native';

import { useDictation } from '@/hooks/use-dictation';
import { MicButton } from './MicButton';
import { SendButton } from './SendButton';
import { colors, spacing, radius, typography } from '@/theme';

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
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            height: isAtMax ? maxHeight : undefined,
            maxHeight,
          },
        ]}
        multiline
        onChangeText={setText}
        onContentSizeChange={handleContentSizeChange}
        onSubmitEditing={handleSend}
        placeholder={isRecording ? 'Listening…' : placeholder}
        placeholderTextColor={colors.text2}
        scrollEnabled={isAtMax}
        value={text}
      />
      {hasText && !isRecording && <SendButton onPress={handleSend} />}
      {(!hasText || isRecording) && (
        <MicButton isRecording={isRecording} onPress={handleMicPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: colors.border,
    backgroundColor: colors.bg2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radius['3xl'],
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  input: {
    color: colors.text,
    minHeight: spacing[8],
    flex: 1,
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: typography.xl,
  },
});
