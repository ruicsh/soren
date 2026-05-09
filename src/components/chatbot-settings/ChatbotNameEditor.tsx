import { StyleSheet, TextInput, View } from 'react-native';

import { ChatbotAvatar } from '@/components/chatbot-avatar/ChatbotAvatar';
import { colors, radius, spacing, typography } from '@/theme';

interface ChatbotNameEditorProps {
  avatarConfig: null | Record<string, boolean | string>;
  modelId: string;
  name: string;
  onNameChange: (text: string) => void;
  providerId: string;
}

export function ChatbotNameEditor(props: ChatbotNameEditorProps) {
  const { avatarConfig, modelId, name, onNameChange, providerId } = props;

  return (
    <View style={styles.avatarSection}>
      <View style={styles.avatarContainer}>
        <ChatbotAvatar
          avatarConfig={avatarConfig}
          modelId={modelId}
          providerId={providerId}
          size={80}
        />
      </View>
      <TextInput
        onChangeText={onNameChange}
        placeholder="Enter name"
        placeholderTextColor={colors.text3}
        style={styles.avatarNameInput}
        testID="chatbot-name-input"
        value={name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.full,
    height: 96,
    justifyContent: 'center',
    marginBottom: spacing[2],
    width: 96,
  },
  avatarNameInput: {
    color: colors.text,
    fontSize: typography.xl,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
    marginTop: spacing[2],
  },
});
