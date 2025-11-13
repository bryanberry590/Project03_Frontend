// src/lib/firebase.web.ts
// for Web
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD0cxLYBoYsQdlWJaPfkXbXLMsTxjph7yE",
  authDomain: "cst438project03.firebaseapp.com",
  projectId: "cst438project03",
  storageBucket: "cst438project03.firebasestorage.app",
  messagingSenderId: "1013334906995",
  appId: "1:1013334906995:web:196748b3aed3ec23077206",
};

const app = initializeApp(firebaseConfig);

//web
export const auth = (() => {
  const a = getAuth(app);
  setPersistence(a, browserLocalPersistence);
  return a;
})();
