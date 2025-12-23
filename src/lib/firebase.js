import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaoAtYcwpjYfKYDXxYPtPzYTqD_9F1ihA",
  authDomain: "cogniquest-9e30c.firebaseapp.com",
  projectId: "cogniquest-9e30c",
  storageBucket: "cogniquest-9e30c.firebasestorage.app",
  messagingSenderId: "876826077844",
  appId: "1:876826077844:web:03bfd443c035de3e966281"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
