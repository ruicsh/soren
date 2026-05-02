import { Image as RNImage } from 'expo-image';
import { StyleSheet } from 'react-native';
import { useCssElement } from 'react-native-css';
import Animated from 'react-native-reanimated';

const AnimatedExpoImage = Animated.createAnimatedComponent(RNImage);

function CSSImage(props: any) {
  const { objectFit, objectPosition, ...style } =
    StyleSheet.flatten(props.style) || {};

  return (
    <AnimatedExpoImage
      contentFit={objectFit}
      contentPosition={objectPosition}
      {...props}
      source={
        typeof props.source === 'string' ? { uri: props.source } : props.source
      }
      style={style}
    />
  );
}

export const Image = (props: any) => {
  return useCssElement(CSSImage, props, { className: 'style' });
};

Image.displayName = 'CSS(Image)';
