import { ScreamRecord } from '../types';

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

export async function saveScream(scream: ScreamRecord): Promise<void> {
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
      try {
        screams = JSON.parse(localData);
      } catch {
        screams = [];
      }
    }
    // Remove existing if any to emulate 'put' (overwrite)
    screams = screams.filter(s => s.id !== scream.id);
    screams.push(scream);
    try {
      localStorage.setItem('scream_app_screams', JSON.stringify(screams));
    } catch (err) {
      console.error('localStorage quota exceeded while saving', err);
      // Try saving without audio data to fit under quota
      const lightweightScream = { ...scream, audioData: undefined };
      screams = screams.filter(s => s.id !== scream.id);
      screams.push(lightweightScream);
      localStorage.setItem('scream_app_screams', JSON.stringify(screams));
    }
  }
}

export async function getAllScreams(): Promise<ScreamRecord[]> {
  try {
    const db = await openDB();
    return await new Promise<ScreamRecord[]>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const list = request.result as ScreamRecord[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('IndexedDB read failed, falling back to localStorage', error);
    const localData = localStorage.getItem('scream_app_screams');
    if (localData) {
      try {
        const list = JSON.parse(localData) as ScreamRecord[];
        list.sort((a, b) => b.timestamp - a.timestamp);
        return list;
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function deleteScream(id: string): Promise<void> {
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
    console.warn('IndexedDB delete failed, falling back to localStorage', error);
    const localData = localStorage.getItem('scream_app_screams');
    if (localData) {
      try {
        const list = JSON.parse(localData) as ScreamRecord[];
        const filtered = list.filter(s => s.id !== id);
        localStorage.setItem('scream_app_screams', JSON.stringify(filtered));
      } catch (err) {
        console.error(err);
      }
    }
  }
}
