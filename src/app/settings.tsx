import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChatbotConfig } from '@/hooks/use-chatbot-config';
import { colors, radius, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const { back } = useRouter();
  const {
    availableVoices,
    config,
    error,
    isLoading,
    isSaving,
    save,
    updateConfig,
  } = useChatbotConfig();

  const handleSave = async () => {
    await save();
    back();
  };

  if (isLoading || !config) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => back()}>
            <Text style={styles.headerBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity disabled={isSaving} onPress={handleSave}>
            {isSaving ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Text style={styles.headerBtnPrimary}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identification</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>UUID</Text>
                <Text selectable style={styles.value}>
                  {config.uuid}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chatbot Profile</Text>
            <View style={styles.card}>
              <View style={[styles.row, styles.rowInput]}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  onChangeText={(name) => updateConfig({ name })}
                  placeholder="Enter name"
                  placeholderTextColor={colors.text3}
                  style={styles.input}
                  value={config.name}
                />
              </View>
              <View style={styles.separator} />
              <View style={styles.column}>
                <Text style={styles.label}>Voice</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    onValueChange={(voiceId) => updateConfig({ voiceId })}
                    selectedValue={config.voiceId}
                    style={styles.picker}
                  >
                    <Picker.Item label="Auto (Default)" value={null} />
                    {availableVoices.map((v) => (
                      <Picker.Item
                        key={v.identifier}
                        label={`${v.name} (${v.language})`}
                        value={v.identifier}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  column: {
    padding: spacing[4],
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  error: {
    color: colors.error,
    fontSize: typography.sm,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerBtn: {
    color: colors.text,
    fontSize: typography.base,
  },
  headerBtnPrimary: {
    color: colors.accent,
    fontSize: typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '600',
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.base,
    textAlign: 'right',
  },
  label: {
    color: colors.text2,
    fontSize: typography.sm,
    fontWeight: '500',
    marginBottom: spacing[1],
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  picker: {
    color: colors.text,
    marginHorizontal: -spacing[2],
  },
  pickerWrap: {
    marginTop: -spacing[2],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  rowInput: {
    paddingVertical: spacing[2],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    color: colors.text3,
    fontSize: typography.xs,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginLeft: spacing[1],
    textTransform: 'uppercase',
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[4],
  },
  value: {
    color: colors.text,
    fontSize: typography.sm,
  },
});
