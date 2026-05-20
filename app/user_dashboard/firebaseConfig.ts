import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDzxcbkP_pEMjMYnV6smCQSbloQ-SkRnyk",
  authDomain: "erecyclomatch-55fe9.firebaseapp.com",
  projectId: "erecyclomatch-55fe9",
  storageBucket: "erecyclomatch-55fe9.firebasestorage.app",
  messagingSenderId: "658995325568",
  appId: "1:658995325568:web:27fa5d4f957b41fec8d465",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);