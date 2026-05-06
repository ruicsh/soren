import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface SettingSelectRowProps {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  value: null | string;
}

export function SettingSelectRow({
  disabled,
  label,
  onPress,
  value,
}: SettingSelectRowProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      style={[styles.container, disabled && styles.disabled]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text numberOfLines={1} style={styles.value}>
          {value || 'None'}
        </Text>
        <ChevronRight color={colors.text3} size={18} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.text,
    fontSize: typography.base,
  },
  value: {
    color: colors.text2,
    fontSize: typography.base,
    marginRight: spacing[1],
    maxWidth: 200,
  },
  valueContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
});
