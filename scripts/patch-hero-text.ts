import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function patchHeroText() {
  try {
    const ref = doc(db, 'settings', 'main');
    await updateDoc(ref, { heroText: 'CODING CLUB SBCE' });
    console.log('✅  heroText updated to "CODING CLUB SBCE" in Firestore.');
  } catch (err) {
    console.error('❌  Failed to update heroText:', err);
  }
  process.exit(0);
}

patchHeroText();
