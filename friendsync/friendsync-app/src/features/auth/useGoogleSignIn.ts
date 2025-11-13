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
import { auth } from "../../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
};

export function useGoogleSignIn() {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
  const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const signIn = async () => {
    console.log("[Auth] signIn pressed. Platform:", Platform.OS);

    if (Platform.OS === "web") {
      // ✅ Web: use Firebase's built-in popup (simpler, more reliable)
      const provider = new GoogleAuthProvider();
      // Optional: force account picker
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
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

    const res = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });
    console.log("[Auth] AuthSession result:", res);

    if (res.type === "success" && res.params?.id_token) {
      const cred = GoogleAuthProvider.credential(res.params.id_token);
      await signInWithCredential(auth, cred);
      return auth.currentUser;
    }
    throw new Error(res.type === "dismiss" ? "Sign-in dismissed" : "Google sign-in canceled or failed");
  };

  const logout = () => signOut(auth);
  return { signIn, logout };
}
