// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTdpuqW1TUO9XAxBKxJzQiJSIvSJAlH_U",
  authDomain: "meditrack-6fb48.firebaseapp.com",
  projectId: "meditrack-6fb48",
  storageBucket: "meditrack-6fb48.firebasestorage.app",
  messagingSenderId: "60316521614",
  appId: "1:60316521614:web:40d6f1e1caeb02cafd25df",
  measurementId: "G-43S21ZZQL8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, app, analytics, googleProvider };
