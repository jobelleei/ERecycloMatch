import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDzcxbkP_pEMjMYnV6smCQSbloQ-SkRhyk",
  authDomain: "erecyclomatch-55fe9.firebaseapp.com",
  projectId: "erecyclomatch-55fe9",
  storageBucket: "erecyclomatch-55fe9.firebasestorage.app",
  messagingSenderId: "658995325568",
  appId: "1:658995325568:web:27fa5d4f957b41fec8d465",
  measurementId: "G-V63MEFCHVP"
};

export const firebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();