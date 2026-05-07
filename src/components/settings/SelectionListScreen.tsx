import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Play, Search, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';

export interface SelectionItem {
  id: null | string;
  label: string;
  onPreview?: () => void;
  sublabel?: string;
}

export interface SelectionListScreenProps {
  isLoading?: boolean;
  items?: SelectionItem[];
  onSelect: (value: null | string) => void;
  searchable?: boolean;
  sections?: SelectionSection[];
  selectedValue: null | string;
  title: string;
}

export interface SelectionSection {
  data: SelectionItem[];
  title: string;
}

export function SelectionListScreen(props: SelectionListScreenProps) {
  const {
    isLoading,
    items,
    onSelect,
    searchable,
    sections: providedSections,
    selectedValue,
    title,
  } = props;

  const { back } = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (id: null | string) => {
    onSelect(id);
    back();
  };

  const sections = useMemo(() => {
    let baseSections: SelectionSection[] = [];

    if (providedSections) {
      baseSections = providedSections;
    } else if (items) {
      baseSections = [{ data: items, title: '' }];
    }

    if (!searchQuery.trim()) return baseSections;

    const query = searchQuery.toLowerCase();

    return baseSections
      .map((section) => ({
        ...section,
        data: section.data.filter(
          (item) =>
            item.label.toLowerCase().includes(query) ||
            item.sublabel?.toLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.data.length > 0);
  }, [providedSections, items, searchQuery]);

  const renderItem = ({
    index,
    item,
    section,
  }: {
    index: number;
    item: SelectionItem;
    section: SelectionSection;
  }) => {
    const isSelected = item.id === selectedValue;
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <View
        style={[
          styles.itemWrapper,
          isFirst && styles.itemFirst,
          isLast && styles.itemLast,
        ]}
      >
        <View style={styles.itemRow}>
          {item.onPreview && (
            <TouchableOpacity
              onPress={item.onPreview}
              style={styles.previewButton}
              testID={`preview-${item.id}`}
            >
              <View style={styles.previewIconCircle}>
                <Play color={colors.accent} fill={colors.accent} size={10} />
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSelect(item.id)}
            style={styles.item}
          >
            <View style={styles.itemTextContainer}>
              <Text
                style={[styles.itemLabel, isSelected && styles.selectedText]}
              >
                {item.label}
              </Text>
              {item.sublabel && (
                <Text style={styles.itemSublabel}>{item.sublabel}</Text>
              )}
            </View>
            {isSelected && <Check color={colors.accent} size={20} />}
          </TouchableOpacity>
        </View>
        {!isLast && <View style={styles.separator} />}
      </View>
    );
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

      {searchable && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color={colors.text3} size={18} style={styles.searchIcon} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={setSearchQuery}
              placeholder="Search..."
              placeholderTextColor={colors.text3}
              style={styles.searchInput}
              value={searchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color={colors.text3} size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <SectionList
        contentContainerStyle={styles.content}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No options available</Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
        renderSectionHeader={({ section: { title: sectionTitle } }) =>
          sectionTitle ? (
            <Text style={styles.sectionHeader}>{sectionTitle}</Text>
          ) : null
        }
        sections={sections}
        stickySectionHeadersEnabled={false}
      />
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
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing[4],
    paddingTop: spacing[2],
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
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  itemFirst: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  itemLabel: {
    color: colors.text,
    fontSize: typography.base,
  },
  itemLast: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  itemRow: {
    alignItems: 'center',
    flexDirection: 'row',
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
  itemWrapper: {
    backgroundColor: colors.bg2,
    overflow: 'hidden',
  },
  previewButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    paddingLeft: spacing[4],
    width: 44,
  },
  previewIconCircle: {
    alignItems: 'center',
    borderColor: colors.accent,
    borderRadius: 12,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    paddingLeft: 1,
    width: 22,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    flexDirection: 'row',
    height: 40,
    paddingHorizontal: spacing[3],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: typography.base,
    height: '100%',
  },
  sectionHeader: {
    color: colors.text2,
    fontSize: typography.sm,
    fontWeight: '600',
    marginBottom: spacing[2],
    marginTop: spacing[6],
    paddingHorizontal: spacing[2],
    textTransform: 'uppercase',
  },
  selectedText: {
    color: colors.accent,
    fontWeight: '500',
  },
  separator: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing[12],
  },
  spacer: {
    width: 80,
  },
});
