import { View, Text, Pressable, Platform } from 'react-native';
import type { StackHeaderProps } from '@react-navigation/stack';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../lib/ThemeProvider';
import HomeScreen from '../screens/HomeScreen';

export default function TopNav({ navigation }: StackHeaderProps) {
  const t = useTheme();
  const currentRoute = useRoute();

  const tabs = [
    { label: 'Welcome', route: 'Welcome' },
    { label: 'Home', route: 'Home' },
    { label: 'Calendar', route: 'Calendar' },
    { label: 'Notifications', route: 'Notifications' }, // placeholder
    { label: 'My Events', route: 'Events' },
    { label: 'Friends', route: 'Friends' },
    { label: 'Settings', route: 'Settings' }, // placeholder
  ];

  const tabsignedout = [
    { label: 'Sign in', route: 'Auth' }, // placeholder
    { label: 'Create Account', route: 'AccountCreation' },
  ];

  return (
    <View
      style={{
        backgroundColor: t.color.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: t.space.lg,
        paddingVertical: Platform.OS === 'web' ? t.space.md : t.space.sm,
        borderBottomWidth: 1,
        borderColor: t.color.border,
        ...t.shadow.md,
      }}
    >
      <Text style={{ color: t.color.text, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 }}>
        FriendSync
      </Text>

      {/*
        Choose which set of tabs to render based on auth state.
        Replace the `signedIn` assignment with your real auth hook/context, e.g.
        const { user } = useAuth(); const signedIn = !!user;
      */}
      {(() => {
        const signedIn = true; // TODO: replace with real auth check
        //currently just choose true or false depending on what you want to see/test
        const menu = signedIn ? tabs : tabsignedout;

        return (
          <View style={{ flexDirection: 'row', columnGap: t.space.lg }}>
        {menu.map((tab) => {
          const active = currentRoute.name === tab.route;
          return (
            <Pressable
          key={tab.route}
          onPress={() => navigation.navigate(tab.route as never)}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
          <Text
            style={{
              color: active ? '#fff' : t.color.text,
              fontWeight: active ? '700' : '500',
              borderBottomWidth: active ? 2 : 0,
              borderBottomColor: active ? t.color.accent : 'transparent',
              paddingBottom: 4,
            }}
          >
            {tab.label}
          </Text>
            </Pressable>
          );
        })}
          </View>
        );
      })()}
    </View>
  );
}
