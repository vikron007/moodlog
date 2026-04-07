import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBBKSly1uKOVjI_La0IChLCn9IVBYWV5Ww",
  authDomain: "moodlog-f1f6a.firebaseapp.com",
  projectId: "moodlog-f1f6a",
  storageBucket: "moodlog-f1f6a.firebasestorage.app",
  messagingSenderId: "810708801036",
  appId: "1:810708801036:web:61b61f60328f5c2b1b0029"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)