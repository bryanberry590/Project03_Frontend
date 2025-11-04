// src/screens/AuthScreen.tsx
import { Text } from 'react-native';
import Screen from '../components/ScreenTmp';
import { useTheme } from '../lib/ThemeProvider';
import HomeScreen from './HomeScreen';

export default function NotificationScreen() {
  const t = useTheme();
  return (
    <Screen>
      <Text style={{ color: t.color.text, fontSize: t.font.h1, fontWeight: '600' }}>
        Notifications (placeholder)
      </Text>
      <Text style={{ color: t.color.textMuted, marginTop: t.space.sm }}>
        List of notifications here
        friend requests, event invites, invitation responses, and reminders
      </Text>
    </Screen>
  );
}
