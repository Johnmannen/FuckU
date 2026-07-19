import { ScreamRecord } from '../types';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
  orderBy
} from "firebase/firestore";

const DB_NAME = 'ScreamAppDB';
const STORE_NAME = 'screams';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Saves a scream. If userId is provided, it attempts to save to Firebase.
 * Otherwise, it saves to local IndexedDB.
 */
export async function saveScream(scream: ScreamRecord, userId?: string): Promise<void> {
  if (userId) {
    try {
      // Save to Firebase Firestore
      const userScreamsRef = doc(db, "users", userId, "screams", scream.id);
      await setDoc(userScreamsRef, { ...scream, userId });
      return;
    } catch (err) {
      console.error("Firebase save failed, falling back to local", err);
    }
  }

  // Local Save (IndexedDB)
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(scream);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB failed, falling back to localStorage', error);
    const localData = localStorage.getItem('scream_app_screams');
    let screams: ScreamRecord[] = [];
    if (localData) {
      try { screams = JSON.parse(localData); } catch { screams = []; }
    }
    screams = screams.filter(s => s.id !== scream.id);
    screams.push(scream);
    localStorage.setItem('scream_app_screams', JSON.stringify(screams));
  }
}

/**
 * Fetches all screams. If userId is provided, it combines local screams with Firebase screams.
 */
export async function getAllScreams(userId?: string): Promise<ScreamRecord[]> {
  let localScreams: ScreamRecord[] = [];

  // Get Local Screams
  try {
    const idb = await openDB();
    localScreams = await new Promise<ScreamRecord[]>((resolve, reject) => {
      const transaction = idb.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as ScreamRecord[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    const localData = localStorage.getItem('scream_app_screams');
    if (localData) {
      try { localScreams = JSON.parse(localData); } catch { localScreams = []; }
    }
  }

  // Get Firebase Screams if logged in
  if (userId) {
    try {
      const userScreamsRef = collection(db, "users", userId, "screams");
      const q = query(userScreamsRef, orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const cloudScreams = querySnapshot.docs.map(doc => doc.data() as ScreamRecord);

      // Combine and remove duplicates (prefer cloud version if IDs match)
      const combined = [...cloudScreams];
      const cloudIds = new Set(cloudScreams.map(s => s.id));

      for (const local of localScreams) {
        if (!cloudIds.has(local.id)) {
          combined.push(local);
        }
      }

      return combined.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error("Firebase fetch failed", err);
    }
  }

  return localScreams.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Deletes a scream from both local and cloud if applicable.
 */
export async function deleteScream(id: string, userId?: string): Promise<void> {
  // Delete from Cloud
  if (userId) {
    try {
      const screamDocRef = doc(db, "users", userId, "screams", id);
      await deleteDoc(screamDocRef);
    } catch (err) {
      console.error("Firebase delete failed", err);
    }
  }

  // Delete from Local
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    const localData = localStorage.getItem('scream_app_screams');
    if (localData) {
      try {
        const list = JSON.parse(localData) as ScreamRecord[];
        const filtered = list.filter(s => s.id !== id);
        localStorage.setItem('scream_app_screams', JSON.stringify(filtered));
      } catch (err) { console.error(err); }
    }
  }
}

/**
 * Helper to sync local screams to cloud after login
 */
export async function syncLocalToCloud(userId: string): Promise<void> {
  const local = await getAllScreams();
  for (const scream of local) {
    await saveScream(scream, userId);
  }
}
