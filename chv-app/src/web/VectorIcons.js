import React from 'react';
import { Text } from 'react-native-web';

const CHAR_MAP = {
  home: '\u{1F3E0}',
  'chart-line': '\u{1F4CA}',
  calendar: '\u{1F4C5}',
  user: '\u{1F464}',
  bell: '\u{1F514}',
  plus: '+',
  check: '\u2713',
  close: '\u2715',
  arrow: '\u2192',
};

function getIconChar(name) {
  return CHAR_MAP[name] || '\u2022';
}

const Icon = React.forwardRef(function({ name, size, color, style, ...props }, ref) {
  return React.createElement(Text, {
    ref,
    style: [{ fontSize: size || 20, color: color || '#000' }, style],
    ...props
  }, getIconChar(name));
});
Icon.displayName = 'Icon';

export default Icon;
export { Icon };
