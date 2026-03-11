import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDph5ibWTD0ixJyISYwHKmy0YzGLpYndHk",
  authDomain: "sribash-2eb85.firebaseapp.com",
  projectId: "sribash-2eb85",
  storageBucket: "sribash-2eb85.firebasestorage.app",
  messagingSenderId: "444668516893",
  appId: "1:444668516893:web:04d14704d5af50217004f4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);