import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCizn0PmLGN8uAhqMCi84iRMelOexw00w8",
  authDomain: "whatsapp-web-28edb.firebaseapp.com",
  projectId: "whatsapp-web-28edb",
  storageBucket: "whatsapp-web-28edb.firebasestorage.app",
  messagingSenderId: "382855328526",
  appId: "1:382855328526:web:2e4b33efff493ab1c85d5f",
  measurementId: "G-HM1ZDQYCR0"
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
