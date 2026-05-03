import React from 'react';
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableHighlight as RNTouchableHighlight,
  View as RNView,
  StyleSheet,
} from 'react-native';
import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from 'react-native-css';
import Animated from 'react-native-reanimated';

import { Link as RouterLink } from 'expo-router';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

// CSS-enabled SafeAreaView
export const SafeAreaView = (
  props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => {
  return useCssElement(RNSafeAreaView, props, { className: 'style' });
};
SafeAreaView.displayName = 'CSS(SafeAreaView)';

// CSS-enabled KeyboardAvoidingView
export const KeyboardAvoidingView = (
  props: React.ComponentProps<typeof RNKeyboardAvoidingView> & {
    className?: string;
  },
) => {
  return useCssElement(RNKeyboardAvoidingView, props, { className: 'style' });
};
KeyboardAvoidingView.displayName = 'CSS(KeyboardAvoidingView)';

// CSS-enabled Link
export const Link = (
  props: React.ComponentProps<typeof RouterLink> & { className?: string },
) => {
  return useCssElement(RouterLink, props, { className: 'style' });
};

Link.Trigger = RouterLink.Trigger;
Link.Menu = RouterLink.Menu;
Link.MenuAction = RouterLink.MenuAction;
Link.Preview = RouterLink.Preview;

// CSS Variable hook
export const useCSSVariable =
  process.env.EXPO_OS !== 'web'
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

// View
export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};

export const View = (props: ViewProps) => {
  return useCssElement(RNView, props, { className: 'style' });
};
View.displayName = 'CSS(View)';

// Text
export const Text = (
  props: React.ComponentProps<typeof RNText> & { className?: string },
) => {
  return useCssElement(RNText, props, { className: 'style' });
};
Text.displayName = 'CSS(Text)';

// ScrollView
export const ScrollView = React.forwardRef<
  RNScrollView,
  React.ComponentProps<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
>((props, ref) => {
  return useCssElement(
    RNScrollView,
    { ...props, ref },
    {
      className: 'style',
      contentContainerClassName: 'contentContainerStyle',
    },
  );
});
ScrollView.displayName = 'CSS(ScrollView)';

// Pressable
export const Pressable = (
  props: React.ComponentProps<typeof RNPressable> & { className?: string },
) => {
  return useCssElement(RNPressable, props, { className: 'style' });
};
Pressable.displayName = 'CSS(Pressable)';

// TextInput
export const TextInput = (
  props: React.ComponentProps<typeof RNTextInput> & { className?: string },
) => {
  return useCssElement(RNTextInput, props, { className: 'style' });
};
TextInput.displayName = 'CSS(TextInput)';

// AnimatedScrollView
export const AnimatedScrollView = (props: any) => {
  return useCssElement(Animated.ScrollView, props, {
    className: 'style',
    contentClassName: 'contentContainerStyle',
    contentContainerClassName: 'contentContainerStyle',
  });
};

// TouchableHighlight with underlayColor extraction
function XXTouchableHighlight(props: any) {
  const { underlayColor, style: originalStyle, ...rest } = props;
  const style = StyleSheet.flatten(originalStyle) || {};
  return (
    <RNTouchableHighlight
      underlayColor={underlayColor}
      {...rest}
      style={style}
    />
  );
}

export const TouchableHighlight = (props: any) => {
  return useCssElement(XXTouchableHighlight, props, { className: 'style' });
};
TouchableHighlight.displayName = 'CSS(TouchableHighlight)';
