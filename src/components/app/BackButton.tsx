import { ArrowLeft } from 'lucide-react-native';
import { type StyleProp, TouchableOpacity, type ViewStyle } from 'react-native';

import { colors } from '@/theme';

export interface BackButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BackButton(props: BackButtonProps) {
  const { onPress, style } = props;

  return (
    <TouchableOpacity
      accessibilityLabel="Go back"
      hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
      onPress={onPress}
      style={style}
    >
      <ArrowLeft color={colors.text} size={24} />
    </TouchableOpacity>
  );
}
