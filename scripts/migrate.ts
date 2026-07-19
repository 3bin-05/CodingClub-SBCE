import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('PLACEHOLDER')) {
  console.error('Error: Please configure your real Firebase credentials in the .env file before running migration.');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dbPath = path.resolve('data/db.json');
if (!fs.existsSync(dbPath)) {
  console.error(`Database file not found at ${dbPath}`);
  process.exit(1);
}

const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

async function migrate() {
  console.log('Starting migration to Firestore...');
  
  // 1. Settings
  console.log('Migrating website settings...');
  await setDoc(doc(db, 'settings', 'site'), dbData.settings);
  console.log('Settings migrated successfully.');
  
  // 2. Events
  console.log(`Migrating ${dbData.events?.length || 0} events...`);
  for (const event of dbData.events || []) {
    await setDoc(doc(db, 'events', event.id), event);
    console.log(`- Migrated event: ${event.title}`);
  }
  
  // 3. Members (Execom)
  console.log(`Migrating ${dbData.members?.length || 0} Execom members...`);
  for (const member of dbData.members || []) {
    await setDoc(doc(db, 'execom', member.id), member);
    console.log(`- Migrated member: ${member.name}`);
  }
  
  // 4. Gallery
  console.log(`Migrating ${dbData.gallery?.length || 0} gallery items...`);
  for (const item of dbData.gallery || []) {
    await setDoc(doc(db, 'gallery', item.id), item);
    console.log(`- Migrated gallery item: ${item.caption || item.id}`);
  }
  
  console.log('All migrations completed successfully!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
});
