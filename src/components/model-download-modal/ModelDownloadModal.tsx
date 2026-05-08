import { Brain } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface ModelDownloadModalProps {
  downloadProgress: number;
  error: Error | null;
  status: 'downloading' | 'error' | 'initializing' | 'ready';
}

export function ModelDownloadModal(props: ModelDownloadModalProps) {
  const { downloadProgress, error, status } = props;
  const [dismissed, setDismissed] = useState(false);

  // Don't show if model is ready or user explicitly dismissed error
  if (status === 'ready' || dismissed) {
    return null;
  }

  const isError = status === 'error';
  const progressPercent = Math.round(downloadProgress * 100);

  return (
    <Modal animationType="fade" transparent visible>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Brain color={isError ? colors.error : colors.accent} size={48} />
          </View>

          <Text style={styles.title}>
            {isError ? 'AI Setup Failed' : 'Setting Up Soren'}
          </Text>

          <Text style={styles.subtitle}>
            {isError
              ? 'Could not initialize on-device intelligence.'
              : 'Downloading on-device intelligence model…'}
          </Text>

          {!isError && (
            <View style={styles.progressSection}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${Math.max(2, progressPercent)}%` },
                  ]}
                />
              </View>
              <Text style={styles.percentText}>
                {status === 'initializing'
                  ? 'Initializing…'
                  : `${progressPercent}%`}
              </Text>
              {status === 'downloading' && (
                <ActivityIndicator
                  color={colors.accent}
                  size="small"
                  style={styles.spinner}
                />
              )}
            </View>
          )}

          {isError && (
            <View style={styles.errorSection}>
              <Text style={styles.errorText}>
                {error?.message || 'Unknown error'}
              </Text>
              <TouchableOpacity
                onPress={() => setDismissed(true)}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Continue Without AI</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.fill,
    borderRadius: radius.md,
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.base,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.xl,
    marginHorizontal: spacing[8],
    padding: spacing[8],
    width: '85%',
  },
  errorSection: {
    alignItems: 'center',
    marginTop: spacing[4],
    width: '100%',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    textAlign: 'center',
  },
  fill: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    height: '100%',
  },
  iconContainer: {
    marginBottom: spacing[4],
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    flex: 1,
    justifyContent: 'center',
  },
  percentText: {
    color: colors.text2,
    fontSize: typography.sm,
    marginTop: spacing[2],
  },
  progressSection: {
    alignItems: 'center',
    marginTop: spacing[6],
    width: '100%',
  },
  spinner: {
    marginTop: spacing[4],
  },
  subtitle: {
    color: colors.text2,
    fontSize: typography.base,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: typography.xl,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  track: {
    backgroundColor: colors.fill,
    borderRadius: radius.full,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
});
