// src/features/auth/useGoogleSignIn.ts
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "../../lib/firebase.web";
import db from "../../lib/db";
import * as simpleSync from "../../lib/sync";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

export function useGoogleSignIn() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
  // const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
  const redirectUri = AuthSession.makeRedirectUri();

  const signIn = async () => {
    console.log("[Auth] signIn pressed. Platform:", Platform.OS);

    if (Platform.OS === "web") {
      // ✅ Web: use Firebase's built-in popup (simpler, more reliable)
      const provider = new GoogleAuthProvider();
      // Optional: force account picker
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);

      //Bryan - initialize the database syncing
      await initialSync();

      return auth.currentUser;
    }

    // Native: use AuthSession -> id_token -> Firebase credential
    if (!clientId) throw new Error("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID");

    const authUrl =
      `${discovery.authorizationEndpoint}` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=id_token` +
      `&scope=${encodeURIComponent("openid profile email")}` +
      `&nonce=${encodeURIComponent(String(Math.random()))}`;

    //Bryan - changed to async
    const res = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    // const res = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });
    console.log("[Auth] AuthSession result:", res);

    // if (res.type === "success" && res.params?.id_token) {
    //   const cred = GoogleAuthProvider.credential(res.params.id_token);
    //   await signInWithCredential(auth, cred);

    //   //Bryan - initialize the database syncing
    //   await initialSync();

    //   return auth.currentUser;
    // }
    if (res.type === "success" && res.url) {
      // Parse the URL to get id_token
      const url = new URL(res.url);
      const hash = url.hash.substring(1); // Remove the '#'
      const params = new URLSearchParams(hash);
      const idToken = params.get('id_token');

      if (idToken) {
        const cred = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, cred);

        await initialSync();

        return auth.currentUser;
      }
    }
    throw new Error(res.type === "dismiss" ? "Sign-in dismissed" : "Google sign-in canceled or failed");
  };

  const logout = async () => {
    console.log("[Auth] Logging out...");
    
    simpleSync.stopAutoSync();
    
    await signOut(auth);
    
    await AsyncStorage.multiRemove(['authToken', 'userId', 'userEmail']);
    
    console.log("[Auth] Logged out and sync stopped");

  };

  const initialSync = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.warn("[Auth] No current user, skipping sync initialization");
        return;
      }

      console.log("[Auth] Initializing sync for user:", user.uid);

      // 1. Initialize local database
      await db.init_db();
      console.log("[Auth] Local database initialized");

      // 2. Get Firebase ID token
      const token = await user.getIdToken();

      // 3. Save auth data to storage
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userId', user.uid);
      await AsyncStorage.setItem('userEmail', user.email || '');

      // 4. Set up sync
      simpleSync.setAuthToken(token);
      
      // Use Firebase UID as userId (your backend should handle this)
      // If your backend expects a numeric ID, you'll need to map it
      simpleSync.startAutoSync(user.uid);

      console.log("[Auth] ✓ Sync started successfully");
    } catch (error) {
      console.error("[Auth] Failed to initialize sync:", error);
      // Don't throw - let the user continue even if sync fails
    }

  };


  return { signIn, logout };
}
