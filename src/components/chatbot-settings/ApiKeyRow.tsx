import { Eye, EyeOff, Key, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface ApiKeyRowProps {
  apiKeyDraft: string;
  hasProviderKey: boolean;
  onClear: () => void;
  onReveal: () => Promise<void>;
  onSave: () => void;
  onUpdateDraft: (text: string) => void;
  providerLabel: string;
}

export function ApiKeyRow(props: ApiKeyRowProps) {
  const {
    apiKeyDraft,
    hasProviderKey,
    onClear,
    onReveal,
    onSave,
    onUpdateDraft,
    providerLabel,
  } = props;

  const [showKey, setShowKey] = useState(false);

  return (
    <View style={[styles.row, styles.rowInput]}>
      <View style={styles.rowInline}>
        <Key
          color={hasProviderKey ? colors.accent : colors.text3}
          size={16}
          style={{ marginRight: spacing[2] }}
        />
        <Text style={styles.label}>API Key</Text>
      </View>
      <View style={[styles.rowInline, { flex: 1, justifyContent: 'flex-end' }]}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={() => apiKeyDraft && onSave()}
          onChangeText={onUpdateDraft}
          placeholder={
            hasProviderKey ? '••••••••••••' : `Enter ${providerLabel} key`
          }
          placeholderTextColor={colors.text3}
          secureTextEntry={!showKey}
          style={[styles.input, { textAlign: 'right' }]}
          value={apiKeyDraft}
        />
        <TouchableOpacity
          onPress={async () => {
            if (!showKey && !apiKeyDraft && hasProviderKey) {
              await onReveal();
            }

            setShowKey(!showKey);
          }}
          style={{ paddingHorizontal: spacing[2] }}
          testID="eye-icon-button"
        >
          {showKey ? (
            <EyeOff color={colors.text3} size={20} />
          ) : (
            <Eye color={colors.text3} size={20} />
          )}
        </TouchableOpacity>
        {hasProviderKey && (
          <TouchableOpacity
            onPress={onClear}
            style={{ paddingLeft: spacing[1] }}
            testID="clear-key-button"
          >
            <Trash2 color={colors.error} size={20} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: colors.text,
    flex: 1,
    fontSize: typography.base,
    textAlign: 'right',
  },
  label: {
    color: colors.text,
    fontSize: typography.base,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  rowInline: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowInput: {
    paddingVertical: spacing[2],
  },
});
