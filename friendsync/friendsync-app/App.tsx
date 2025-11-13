import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/lib/ThemeProvider';
import storage from './src/lib/storage';
import db from './src/lib/db';

// added: 
import { auth } from "./src/lib/firebase"; // added these imports for auth listener - justin
import { onAuthStateChanged } from "firebase/auth"; // added these imports for auth listener - justin
import { AuthProvider } from './src/features/auth/AuthProvider';


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

  // sanity check auth state change - justin
  useEffect(() => {
    // Verify Firebase initialized properly
    console.log('Firebase app name:', auth.app.name);

    // Listenenr for auth state changes
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log(`Auth state: signed in as ${user.email ?? user.uid}`);
      } else {
        console.log('Auth state: signed out');
      }
    });

    return unsub; // cleanup listener on unmount
  }, []);



  // app render

  if (!isReady) {
    return (
      <ThemeProvider>
        {/* loading shell while restoring */}
      </ThemeProvider>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer
          initialState={initialState}
          onStateChange={(state) => {
            try { if (state) storage.setItem(NAV_STATE_KEY, state); } catch {}
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}