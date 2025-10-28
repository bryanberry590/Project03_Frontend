// src/screens/HomeScreen.tsx
import { Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';

export default function HomeScreen() {
  const t = useTheme();
  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '700' }}>
        Welcome to FriendSync
      </Text>
      <Text style={{ color: t.color.textMuted, marginTop: t.space.sm }}>
        Sync up!
      </Text>
    </Screen>
  );
}
