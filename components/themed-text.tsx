import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts, FontSizes } from '@/constants/theme';

export type ThemedTextType =
  | 'default'
  | 'defaultSemiBold'
  | 'title'
  | 'subtitle'
  | 'link'
  | 'display'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemedTextType;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color, fontFamily: Fonts?.rounded },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: FontSizes.base,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: FontSizes.base,
    lineHeight: 24,
    fontWeight: '600',
  },
  display: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyBold: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  label: {
    fontSize: FontSizes.xs,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  link: {
    fontSize: FontSizes.base,
    lineHeight: 24,
    fontWeight: '500',
    color: '#A78BFA',
    textDecorationLine: 'underline',
  },
});
