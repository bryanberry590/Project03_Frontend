import { View, ViewProps } from 'react-native';
import { useTheme } from '../lib/ThemeProvider';

export default function Screen({ style, ...rest }: ViewProps) {
  const t = useTheme();
  return (
    <View
      style={[{ flex: 1, backgroundColor: t.color.bg, padding: t.space.lg }, style]}
      {...rest}
    />
  );
}
