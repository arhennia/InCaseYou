import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIIfLHGT3tg8n9i2UlpnAPzRaRdQ4ZP8c",
  authDomain: "incaseyou-e8324.firebaseapp.com",
  projectId: "incaseyou-e8324",
  storageBucket: "incaseyou-e8324.firebasestorage.app",
  messagingSenderId: "552772702575",
  appId: "1:552772702575:web:ea579c85959421028e989a",
  measurementId: "G-9TK5ZK6WE1"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);