import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

export async function shareCollection(appState) {
    try {
        const collectionsRef = collection(db, "collections");
        const newDocRef = doc(collectionsRef); // Generates a random ID
        await setDoc(newDocRef, appState);
        return newDocRef.id;
    } catch (error) {
        console.error("Error sharing collection:", error);
        throw error;
    }
}

export async function loadCollection(id) {
    try {
        const docRef = doc(db, "collections", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.error("No such collection found!");
            return null;
        }
    } catch (error) {
        console.error("Error loading collection:", error);
        throw error;
    }
}