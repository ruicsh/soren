import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  type TextInputContentSizeChangeEvent,
  useWindowDimensions,
  View,
} from 'react-native';

import { useDictation } from '@/hooks/use-dictation';
import { colors, radius, spacing, typography } from '@/theme';

import { BTN_SIZE } from './const';
import { MicButton } from './MicButton';
import { SendButton } from './SendButton';

export interface ChatInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
}

export function ChatInput(props: ChatInputProps) {
  const { onSend, placeholder = 'Message…' } = props;

  const [text, setText] = useState('');
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    undefined,
  );
  const { height: screenHeight } = useWindowDimensions();
  const { isRecording, startDictation, stopDictation, transcript } =
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
        multiline
        onChangeText={setText}
        onContentSizeChange={handleContentSizeChange}
        onSubmitEditing={handleSend}
        placeholder={isRecording ? 'Listening…' : placeholder}
        placeholderTextColor={colors.text2}
        scrollEnabled={isAtMax}
        style={[
          styles.input,
          {
            height: isAtMax ? maxHeight : undefined,
            maxHeight,
          },
        ]}
        value={text}
      />
      <View style={styles.buttonSlot}>
        {hasText && !isRecording && <SendButton onPress={handleSend} />}
        {(!hasText || isRecording) && (
          <MicButton isRecording={isRecording} onPress={handleMicPress} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonSlot: {
    alignItems: 'center',
    bottom: spacing[3],
    height: BTN_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing[4],
    width: BTN_SIZE,
  },
  container: {
    backgroundColor: colors.bg2,
    borderColor: colors.border,
    borderRadius: radius['3xl'],
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.base,
    minHeight: spacing[8],
    paddingBottom: spacing[2],
    paddingRight: BTN_SIZE + spacing[2],
    paddingTop: spacing[2],
    textAlignVertical: 'center',
  },
});
