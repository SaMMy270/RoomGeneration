// minimal Firebase Firestore save/load example
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...
};

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase init failed — replace config to enable saving.", e);
}

export async function saveRoomToFirestore(roomPayload) {
  if (!db) throw new Error("Firestore not initialized");
  const col = collection(db, "rooms");
  const docRef = await addDoc(col, roomPayload);
  console.log("Saved doc id:", docRef.id);
  return docRef.id;
}

export async function loadRoomFromFirestore() {
  if (!db) throw new Error("Firestore not initialized");
  const col = collection(db, "rooms");
  const q = query(col, orderBy("createdAt", "desc"), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return doc.data();
}
