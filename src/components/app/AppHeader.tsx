import { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

import { BackButton } from './BackButton';

export interface AppHeaderProps {
  /** testID for the center title text */
  centerTestID?: string;

  /** When true, omits the back button entirely */
  hideBackButton?: boolean;

  /** Content rendered after the back button in the left area — only used in 'custom' variant */
  leftContent?: React.ReactNode;

  /** Called when back button is pressed (can be omitted when hideBackButton is true) */
  onBack?: () => void;

  /** Content rendered in the right slot/area */
  rightSlot?: React.ReactNode;

  /** Title text — only used in 'title' variant */
  title?: string;

  /** Header variant */
  variant?: 'custom' | 'title';
}

export function AppHeader(props: AppHeaderProps) {
  const {
    centerTestID,
    hideBackButton,
    leftContent,
    onBack,
    rightSlot,
    title,
    variant = 'title',
  } = props;

  // Stable handleBack that always calls the latest onBack callback
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;
  const handleBack = useCallback(() => {
    onBackRef.current?.();
  }, []);

  if (variant === 'custom') {
    return (
      <View style={styles.headerCustom}>
        <View style={styles.leftArea}>
          {!hideBackButton && <BackButton onPress={handleBack} />}
          {leftContent}
        </View>
        <View style={styles.rightArea}>{rightSlot}</View>
      </View>
    );
  }

  return (
    <View style={styles.headerTitleVariant}>
      <View style={styles.sideSlot}>
        {!hideBackButton && <BackButton onPress={handleBack} />}
      </View>
      <View style={styles.centerSlot}>
        <Text style={styles.titleText} testID={centerTestID}>
          {title}
        </Text>
      </View>
      <View style={[styles.sideSlot, styles.rightSlot]}>{rightSlot}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerCustom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[2],
    paddingTop: spacing[4],
  },
  headerTitleVariant: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  leftArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
  },
  rightArea: {
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  sideSlot: {
    justifyContent: 'center',
    minWidth: 60,
  },
  titleText: {
    color: colors.text,
    fontSize: typography.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
});
