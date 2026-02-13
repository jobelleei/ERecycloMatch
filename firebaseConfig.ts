import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC82mI2hCOMks4t-YTpMOL0fXDsfQjGPKw",
  authDomain: "erecyclomatch.firebaseapp.com",
  projectId: "erecyclomatch",
  storageBucket: "erecyclomatch.firebasestorage.app",
  messagingSenderId: "885435765659",
  appId: "1:885435765659:web:551a0e3134ba3f99e8073e",
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);