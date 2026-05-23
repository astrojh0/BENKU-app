import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    User,
} from 'firebase/auth';
import {
    collection,
    deleteDoc,
    doc,
    DocumentData,
    Firestore,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    onSnapshot,
    orderBy,
    query,
    setDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD6T-X7eMSKF6G85h58VEtKJISEQud0JOk',
  authDomain: 'benku-app.firebaseapp.com',
  projectId: 'benku-app',
  storageBucket: 'benku-app.firebasestorage.app',
  messagingSenderId: '120336049028',
  appId: '1:120336049028:web:9c912c1e4666fd065af3d1',
};

let app: FirebaseApp;
let auth: ReturnType<typeof getAuth>;
let db: Firestore;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
  }
  return app;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

let currentUser: User | null = null;
let authReady = false;
const authReadyCallbacks: (() => void)[] = [];

export function onAuthReady(cb: () => void) {
  if (authReady) {
    cb();
  } else {
    authReadyCallbacks.push(cb);
  }
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getUserId(): string | null {
  return currentUser?.uid || null;
}

export async function initFirebase(): Promise<User> {
  const auth = getFirebaseAuth();

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        authReady = true;
        authReadyCallbacks.forEach((cb) => cb());
        authReadyCallbacks.length = 0;
        resolve(user);
        return;
      }

      try {
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
        authReady = true;
        authReadyCallbacks.forEach((cb) => cb());
        authReadyCallbacks.length = 0;
        resolve(cred.user);
      } catch (e) {
        console.warn('Firebase anonymous sign-in failed:', e);
        reject(e);
      }
    }, reject);

    setTimeout(() => {
      unsubscribe();
    }, 30000);
  });
}

function userDoc(userId: string, collectionName: string, docId: string) {
  return doc(getFirestoreDb(), 'users', userId, collectionName, docId);
}

function userCollection(userId: string, collectionName: string) {
  return collection(getFirestoreDb(), 'users', userId, collectionName);
}

export async function saveDocument(
  userId: string,
  collectionName: string,
  docId: string,
  data: DocumentData,
): Promise<void> {
  await setDoc(userDoc(userId, collectionName, docId), data, { merge: true });
}

export async function getDocument<T = DocumentData>(
  userId: string,
  collectionName: string,
  docId: string,
): Promise<T | null> {
  const snap = await getDoc(userDoc(userId, collectionName, docId));
  return snap.exists() ? (snap.data() as T) : null;
}

export async function deleteDocument(
  userId: string,
  collectionName: string,
  docId: string,
): Promise<void> {
  await deleteDoc(userDoc(userId, collectionName, docId));
}

export async function getCollection<T = DocumentData>(
  userId: string,
  collectionName: string,
  maxResults = 500,
): Promise<T[]> {
  const q = query(
    userCollection(userId, collectionName),
    orderBy('createdAt', 'desc'),
    limit(maxResults),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
}

export function listenCollection<T = DocumentData>(
  userId: string,
  collectionName: string,
  callback: (data: T[]) => void,
  maxResults = 500,
): () => void {
  const q = query(
    userCollection(userId, collectionName),
    orderBy('createdAt', 'desc'),
    limit(maxResults),
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as unknown as T);
    callback(data);
  });
}

export function listenDocument<T = DocumentData>(
  userId: string,
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void,
): () => void {
  return onSnapshot(userDoc(userId, collectionName, docId), (snap) => {
    callback(snap.exists() ? (snap.data() as T) : null);
  });
}