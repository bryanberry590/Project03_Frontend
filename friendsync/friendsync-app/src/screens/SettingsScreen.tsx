// src/screens/AuthScreen.tsx
import { Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';
import { Theme } from '../lib/theme';

export default function AuthScreen() {
  const t = useTheme();
  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '600' }}>
        User Settings (placeholder)
      </Text>
      <Text style={{ color: t.color.textMuted, marginTop: t.space.sm }}>
        Settings will go here. Includes potentially
        username, password and contact info
        Theme selection, notification preferences
        Landing Page display options
        and anything else we think of
      </Text>
    </Screen>
  );
}
