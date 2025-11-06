// src/screens/AuthScreen.tsx
import { Text, View } from "react-native";
import Screen from "../components/ScreenTmp";
import { useTheme } from "../lib/ThemeProvider";

export default function WelcomeScreen() {
  const t = useTheme();



  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{color: t.color.text, fontSize: t.font.h1 * 1.4, fontWeight: "600", textAlign: "center",}}>
          Welcome to FriendSync!
        </Text>
        <Text style={{ color: t.color.textMuted, marginTop: t.space.sm }}>
          Sign in button here
        </Text>
      </View>
    </Screen>
  );
}
