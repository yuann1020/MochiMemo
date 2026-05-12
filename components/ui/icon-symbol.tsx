// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill':                              'home',
  'paperplane.fill':                         'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right':                           'chevron-right',
  'arrow.left':                              'arrow-back',
  'arrow.right':                             'arrow-forward',
  'ellipsis':                                'more-vert',
  'mic.fill':                                'mic',
  'chart.bar.fill':                          'bar-chart',
  'chart.pie.fill':                          'pie-chart',
  'person.fill':                             'person',
  'sparkles':                                'auto-awesome',
  'waveform':                                'graphic-eq',
  'xmark':                                   'close',
  'checkmark':                               'check',
  'magnifyingglass':                         'search',
  'bell.fill':                               'notifications',
  'calendar':                                'calendar-today',
  'arrow.counterclockwise':                  'refresh',
  'creditcard.fill':                         'credit-card',
  'lock.fill':                               'lock',
  'questionmark.circle.fill':                'help-outline',
  'star.fill':                               'star',
  'heart.fill':                              'favorite',
  'pencil':                                  'edit',
  'keyboard':                                'keyboard',
  'plus':                                    'add',
  'plus.circle.fill':                        'add-circle',
  'clock.fill':                              'schedule',
  'banknote.fill':                           'payments',
  'slider.horizontal.3':                     'tune',
  'arrow.down.to.line':                      'download',
  'trash.fill':                              'delete',
  'info.circle.fill':                        'info',
  'shield.fill':                             'shield',
  'tag.fill':                                'local-offer',
  'exclamationmark.triangle.fill':           'warning',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
