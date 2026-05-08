import { useRouter } from 'expo-router';
import { Mic } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app/AppHeader';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useDictation } from '@/hooks/use-dictation';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/chatbot-config';
import { colors, spacing, typography } from '@/theme';

export default function PersonalitySelectionScreen() {
  const { back } = useRouter();
  const { config, saveWithConfig } = useChatbotConfig();
  const [draft, setDraft] = useState(
    config?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
  );

  const { isRecording, startDictation, stopDictation, transcript } =
    useDictation();

  // Initialize draft when config loads
  useEffect(() => {
    if (config?.systemPrompt && !draft) {
      setDraft(config.systemPrompt);
    }
  }, [config?.systemPrompt, draft]);

  // Append dictation transcript exactly once when session ends
  const [prevTranscript, setPrevTranscript] = useState('');
  useEffect(() => {
    if (isRecording) {
      const delta = transcript.slice(prevTranscript.length);
      if (delta) {
        setDraft(
          (prev) => (prev.endsWith(' ') || !prev ? prev : prev + ' ') + delta,
        );
      }
      setPrevTranscript(transcript);
    } else {
      setPrevTranscript('');
    }
  }, [isRecording, transcript, prevTranscript.length]);

  const handleBack = async () => {
    const finalPrompt = draft.trim() || DEFAULT_SYSTEM_PROMPT;
    await saveWithConfig({ systemPrompt: finalPrompt });
    back();
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopDictation();
    } else {
      startDictation();
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <AppHeader onBack={handleBack} title="Personality" variant="title" />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editorContainer}
          >
            <TextInput
              autoFocus
              multiline
              onChangeText={setDraft}
              placeholder="System prompt..."
              placeholderTextColor={colors.text3}
              style={styles.input}
              textAlignVertical="top"
              value={draft}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleMicPress}
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                ]}
                testID="mic-button"
              >
                <Mic color={isRecording ? '#ffffff' : colors.text} size={24} />
              </TouchableOpacity>
              <Text style={styles.hint}>
                {isRecording ? 'Listening...' : 'Tap to dictate'}
              </Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    padding: spacing[4],
  },
  flex: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing[4],
  },
  hint: {
    color: colors.text3,
    fontSize: typography.sm,
    marginLeft: spacing[3],
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.base,
    lineHeight: 22,
    paddingTop: spacing[2],
  },
  micButton: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  micButtonActive: {
    backgroundColor: colors.accent,
  },
});
