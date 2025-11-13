import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/lib/ThemeProvider';
import storage from './src/lib/storage';
import db from './src/lib/db';

const NAV_STATE_KEY = 'navigation_state_v1';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState<any | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        // initialize DB (native or fallback)
        await db.init_db();

        const saved = await storage.getItem(NAV_STATE_KEY);
        if (mounted && saved) setInitialState(saved);
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setIsReady(true);
      }
    };
    restore();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isReady) {
    return (
      <ThemeProvider>
        {/* loading shell while restoring */}
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer
        initialState={initialState}
        onStateChange={(state) => {
          try {
            if (state) storage.setItem(NAV_STATE_KEY, state);
          } catch (e) {
            // ignore
          }
        }}
      >
        <RootNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}