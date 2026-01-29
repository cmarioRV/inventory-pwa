import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA6vYtK2V9f7-iqg2A7BypksrPH5mJ5C2E",
  authDomain: "warehouse-57475.firebaseapp.com",
  projectId: "warehouse-57475",
  storageBucket: "warehouse-57475.firebasestorage.app",
  messagingSenderId: "283525835192",
  appId: "1:283525835192:web:f87dd71b9397bbb18f074d",
  measurementId: "G-1QV4NJ89TZ"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);