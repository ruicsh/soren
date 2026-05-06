import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';

export interface SelectionItem {
  id: null | string;
  label: string;
  sublabel?: string;
}

interface SelectionListScreenProps {
  isLoading?: boolean;
  items: SelectionItem[];
  onSelect: (value: null | string) => void;
  selectedValue: null | string;
  title: string;
}

export function SelectionListScreen({
  isLoading,
  items,
  onSelect,
  selectedValue,
  title,
}: SelectionListScreenProps) {
  const { back } = useRouter();

  const handleSelect = (id: null | string) => {
    onSelect(id);
    back();
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => back()} style={styles.backBtn}>
          <ChevronLeft color={colors.accent} size={24} />
          <Text style={styles.backBtnText}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {items.map((item, index) => {
            const isSelected = item.id === selectedValue;
            return (
              <React.Fragment key={String(item.id)}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item.id)}
                  style={styles.item}
                >
                  <View style={styles.itemTextContainer}>
                    <Text
                      style={[
                        styles.itemLabel,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.sublabel && (
                      <Text style={styles.itemSublabel}>{item.sublabel}</Text>
                    )}
                  </View>
                  {isSelected && <Check color={colors.accent} size={20} />}
                </TouchableOpacity>
                {index < items.length - 1 && <View style={styles.separator} />}
              </React.Fragment>
            );
          })}
          {items.length === 0 && !isLoading && (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No options available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    left: spacing[2],
    position: 'absolute',
  },
  backBtnText: {
    color: colors.accent,
    fontSize: typography.base,
    marginLeft: -spacing[1],
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing[4],
  },
  empty: {
    padding: spacing[8],
  },
  emptyText: {
    color: colors.text3,
    fontSize: typography.base,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '600',
  },
  item: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  itemLabel: {
    color: colors.text,
    fontSize: typography.base,
  },
  itemSublabel: {
    color: colors.text2,
    fontSize: typography.sm,
    marginTop: spacing[0.5],
  },
  itemTextContainer: {
    flex: 1,
    marginRight: spacing[4],
  },
  selectedText: {
    color: colors.accent,
    fontWeight: '500',
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[4],
  },
  spacer: {
    width: 80,
  },
});
