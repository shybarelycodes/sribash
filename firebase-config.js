// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDph5ibWIDoixJyISYwHKmy0YzGLpYpdHk",
  authDomain: "sribash-2eb85.firebaseapp.com",
  projectId: "sribash-2eb85",
  storageBucket: "sribash-2eb85.firebasestorage.app",
  messagingSenderId: "444668516893",
  appId: "1:444668516893:web:1ae95ea4bafd71bc7004f4",
  measurementId: "G-X9VR7FG01P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
