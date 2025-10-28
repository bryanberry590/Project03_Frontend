// src/screens/CalendarScreen.tsx
import { Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';

export default function CalendarScreen() {
  const t = useTheme();
  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '600' }}>
        Calendar (placeholder)
      </Text>
      <Text style={{ color: t.color.textMuted, marginTop: t.space.sm }}>
        Weekly grid coming next.
      </Text>
    </Screen>
  );
}
