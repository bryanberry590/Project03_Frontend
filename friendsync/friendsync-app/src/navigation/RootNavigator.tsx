import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import EventsScreen from '../screens/EventsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import AuthScreen from '../screens/AuthScreen';
import TopNav from '../components/TopNav';

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
    </Stack.Navigator>
  );
}
