import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EventsScreen from '../screens/EventsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import AuthScreen from '../screens/AuthScreen';
import TopNav from '../components/TopNav';
import AccountCreationScreen from '../screens/AccountCreationScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import ApiTestScreen from '../screens/ApiTestScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      // apply TopNav as global header
      screenOptions={{
        header: (props) => <TopNav {...props} />,
      }}
    >
      {/* Main app screens */}
      <Stack.Screen 
        name="ApiTest" 
        component={ApiTestScreen}
        options={{ title: 'API Test' }}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ title: 'Welcome' }}
      />
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: 'Events' }}
      />
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{ title: 'Friends' }}
      />
      {/* Placeholder for future login/register */}
      <Stack.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: 'Authentication' }}
      />
      <Stack.Screen
        name="AccountCreation"
        component={AccountCreationScreen}
        options={{ title: 'Account Creation' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />

    </Stack.Navigator>
  );
}
