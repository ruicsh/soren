import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatbotAvatar } from '@/components/chatbot-avatar/ChatbotAvatar';
import { CallButton } from '@/components/voice/CallButton';
import { PulseAnimation } from '@/components/voice/PulseAnimation';
import { WaveformAnimation } from '@/components/voice/WaveformAnimation';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { useVoiceMode } from '@/hooks/use-voice-mode';
import { colors, radius, spacing, typography } from '@/theme';

export default function VoiceScreen() {
  const { back } = useRouter();
  const { config } = useChatbotConfig();
  const { activate, deactivate, error, state, transcript } = useVoiceMode({
    chatbotUuid: config?.uuid,
    llmModel: config?.llmModel,
    llmProvider: config?.llmProvider,
    voiceId: config?.voiceId,
  });

  useEffect(() => {
    activate();

    return () => {
      deactivate();
    };
  }, [activate, deactivate]);

  const chatbotName = config?.name ?? 'Soren';
  const modelName = config?.llmModel ?? '';

  const statusText =
    state === 'connecting'
      ? 'Connecting…'
      : state === 'listening'
        ? transcript.trim()
          ? 'Listening…'
          : "Go ahead, I'm listening"
        : state === 'processing'
          ? 'Thinking…'
          : state === 'speaking'
            ? 'Speaking…'
            : error
              ? 'Connection Error'
              : chatbotName;

  const showWaveform = state === 'listening';
  const showPulse = state === 'processing' || state === 'speaking';

  const handleDisconnect = () => {
    deactivate();
    back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <ChatbotAvatar
            modelId={config?.llmModel}
            providerId={config?.llmProvider}
            size={120}
          />
        </View>
        <Text style={styles.name}>{chatbotName}</Text>
        {modelName ? <Text style={styles.modelName}>{modelName}</Text> : null}
        <Text style={[styles.status, error ? styles.statusError : null]}>
          {statusText}
        </Text>

        <View style={styles.animation}>
          {showWaveform && <WaveformAnimation />}
          {showPulse && <PulseAnimation />}
        </View>

        <View style={styles.transcriptContainer}>
          <Text numberOfLines={4} style={styles.transcript}>
            {transcript}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.controls}>
        <CallButton onPress={handleDisconnect} />
        <Text style={styles.endText}>End Call</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  animation: {
    alignItems: 'center',
    height: 100,
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.full,
    height: 160,
    justifyContent: 'center',
    marginTop: spacing[12],
    width: 160,
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
  },
  controls: {
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  endText: {
    color: colors.text2,
    fontSize: typography.sm,
    marginTop: spacing[2],
  },
  error: {
    color: colors.error,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: radius.lg,
    marginTop: spacing[8],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  modelName: {
    color: colors.text3,
    fontSize: typography.sm,
    marginTop: spacing[1],
  },
  name: {
    color: colors.text,
    fontSize: typography['3xl'],
    fontWeight: '700',
    marginTop: spacing[6],
  },
  status: {
    color: colors.text2,
    fontSize: typography.lg,
    marginTop: spacing[2],
  },
  statusError: {
    color: colors.error,
  },
  transcript: {
    color: colors.text2,
    fontSize: typography.xl,
    textAlign: 'center',
  },
  transcriptContainer: {
    height: 120,
    justifyContent: 'center',
    marginTop: spacing[8],
    paddingHorizontal: spacing[10],
  },
});
