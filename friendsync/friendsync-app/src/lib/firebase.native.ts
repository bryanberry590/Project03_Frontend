// src/lib/firebase.native.ts 
// for React Native (iOS/Android)
import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getReactNativePersistence } from "firebase/auth/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyD0cxLYBoYsQdlWJaPfkXbXLMsTxjph7yE",
  authDomain: "cst438project03.firebaseapp.com",
  projectId: "cst438project03",
  storageBucket: "cst438project03.firebasestorage.app",
  messagingSenderId: "1013334906995",
  appId: "1:1013334906995:web:196748b3aed3ec23077206",
};

const app = initializeApp(firebaseConfig);

// Native (iOS/Android): use AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
