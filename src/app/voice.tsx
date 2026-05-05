import { useRouter } from 'expo-router';
import { Brain as IconBrain } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CallButton } from '@/components/voice/CallButton';
import { PulseAnimation } from '@/components/voice/PulseAnimation';
import { WaveformAnimation } from '@/components/voice/WaveformAnimation';
import { useVoiceMode } from '@/hooks/use-voice-mode';
import { colors, radius, spacing, typography } from '@/theme';

export default function VoiceScreen() {
  const { back } = useRouter();
  const { activate, deactivate, error, state, transcript } = useVoiceMode();

  useEffect(() => {
    activate();
    return () => {
      deactivate();
    };
  }, [activate, deactivate]);

  const handleDisconnect = () => {
    deactivate();
    back();
  };

  const statusText =
    state === 'connecting'
      ? 'Connecting…'
      : state === 'listening'
        ? 'Listening…'
        : state === 'processing'
          ? 'Thinking…'
          : state === 'speaking'
            ? 'Speaking…'
            : error
              ? 'Error'
              : 'Soren';

  const showWaveform = state === 'listening';
  const showPulse = state === 'processing' || state === 'speaking';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <IconBrain color={colors.accent} size={80} />
        </View>
        <Text style={styles.name}>Soren</Text>
        <Text style={styles.status}>{statusText}</Text>

        <View style={styles.animation}>
          {showWaveform && <WaveformAnimation />}
          {showPulse && <PulseAnimation />}
        </View>

        <Text numberOfLines={4} style={styles.transcript}>
          {transcript}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.controls}>
        <CallButton onPress={handleDisconnect} />
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
    height: 120,
    justifyContent: 'center',
    marginTop: spacing[12],
    width: 120,
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
  error: {
    color: colors.error,
    fontSize: typography.sm,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  name: {
    color: colors.text,
    fontSize: typography['2xl'],
    fontWeight: '600',
    marginTop: spacing[4],
  },
  status: {
    color: colors.text2,
    fontSize: typography.base,
    marginTop: spacing[1],
  },
  transcript: {
    color: colors.text2,
    fontSize: typography.lg,
    marginTop: spacing[6],
    paddingHorizontal: spacing[8],
    textAlign: 'center',
  },
});
