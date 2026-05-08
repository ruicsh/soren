import NiceAvatar, { genConfig } from '@zamplyy/react-native-nice-avatar';
import { useRouter } from 'expo-router';
import { Brain } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app/AppHeader';
import {
  applyAvatarBW,
  type NiceAvatarConfig,
} from '@/components/chatbot-avatar/avatar-bw';
import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { colors, radius, spacing, typography } from '@/theme';

const OPTIONS_COUNT = 9;
const PREVIEW_SIZE = 78;

export default function AvatarSelectionScreen() {
  const { back } = useRouter();
  const { config, saveWithConfig } = useChatbotConfig();
  const [options, setOptions] = useState<NiceAvatarConfig[]>([]);

  const shuffle = useCallback(() => {
    try {
      const generated = Array.from({ length: OPTIONS_COUNT }, () =>
        genConfig(),
      ) as NiceAvatarConfig[];
      setOptions(generated);
    } catch {
      // If genConfig fails, keep existing options unchanged
    }
  }, []);

  useEffect(() => {
    shuffle();
  }, [shuffle]);

  const handleSelect = (selectedConfig: NiceAvatarConfig | null) => {
    saveWithConfig({ avatarConfig: selectedConfig });
    back();
  };

  const isDefaultSelected = config?.avatarConfig === null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <AppHeader onBack={() => back()} title="Avatar" variant="title" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Default row */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelect(null)}
          style={styles.defaultRow}
        >
          <View style={styles.defaultPreview}>
            <Brain color={colors.text2} size={32} />
          </View>
          <View style={styles.defaultTextContainer}>
            <Text style={styles.defaultLabel}>Default</Text>
            <Text style={styles.defaultSublabel}>
              Use provider / model logo
            </Text>
          </View>
          {isDefaultSelected && <View style={styles.selectedDot} />}
        </TouchableOpacity>

        {/* Custom Avatars grid — 3x3 */}
        {options.length > 0 ? (
          <>
            <Text style={styles.gridTitle}>Custom Avatars</Text>
            <View style={styles.grid}>
              {options.map((opt, index) => {
                const bwConfig = applyAvatarBW(opt);

                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    key={index}
                    onPress={() => handleSelect(opt)}
                    style={styles.gridItem}
                  >
                    <NiceAvatar
                      shape="rounded"
                      size={PREVIEW_SIZE}
                      {...(bwConfig as any)}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>Failed to generate avatars</Text>
        )}

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={shuffle}
          style={styles.shuffleButton}
        >
          <Text style={styles.shuffleText}>Shuffle</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingTop: spacing[6],
  },
  defaultLabel: {
    color: colors.text,
    fontSize: typography.base,
    fontWeight: '500',
  },
  defaultPreview: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.full,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing[3],
    width: 48,
  },
  defaultRow: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    flexDirection: 'row',
    padding: spacing[3],
  },
  defaultSublabel: {
    color: colors.text3,
    fontSize: typography.sm,
    marginTop: spacing[0.5],
  },
  defaultTextContainer: {
    flex: 1,
  },
  emptyText: {
    color: colors.text3,
    fontSize: typography.base,
    padding: spacing[8],
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    justifyContent: 'center',
  },
  gridItem: {
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing[1],
  },
  gridTitle: {
    color: colors.text2,
    fontSize: typography.sm,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginLeft: spacing[1],
    marginTop: spacing[6],
    textTransform: 'uppercase',
  },
  selectedDot: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  shuffleButton: {
    alignSelf: 'center',
    borderColor: colors.accent,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing[6],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[3],
  },
  shuffleText: {
    color: colors.accent,
    fontSize: typography.base,
    fontWeight: '600',
  },
});
