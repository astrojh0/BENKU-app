import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sentence } from '../models/sentence';
import { ConversationRecord } from '../utils/conversations';
import {
    getCollection,
    getDocument,
    getUserId,
    initFirebase,
    listenCollection,
    listenDocument,
    onAuthReady,
    saveDocument
} from './firebase';

const MIGRATED_KEY = 'benku_cloud_migrated';

let userId: string | null = null;
let initialized = false;

export async function initSync(): Promise<void> {
  if (initialized) return;
  try {
    await initFirebase();
    onAuthReady(() => {
      userId = getUserId();
    });
    initialized = true;
  } catch (e) {
    console.warn('Firebase init failed, using local storage only:', e);
    initialized = true;
  }
}

function getUid(): string | null {
  return userId || getUserId();
}

export async function migrateLocalData(): Promise<void> {
  const uid = getUid();
  if (!uid) return;

  const alreadyMigrated = await AsyncStorage.getItem(MIGRATED_KEY);
  if (alreadyMigrated === uid) return;

  try {
    const rawSentences = await AsyncStorage.getItem('benku_sentences');
    if (rawSentences) {
      const sentences: Sentence[] = JSON.parse(rawSentences);
      for (const s of sentences) {
        await saveDocument(uid, 'sentences', s.id, { ...s, _localId: s.id });
      }
    }

    const rawFolders = await AsyncStorage.getItem('benku_folders');
    if (rawFolders) {
      const folders: string[] = JSON.parse(rawFolders);
      await saveDocument(uid, 'settings', 'folders', { folders });
    }

    const rawConvs = await AsyncStorage.getItem('benku_conversations');
    if (rawConvs) {
      const convs: ConversationRecord[] = JSON.parse(rawConvs);
      for (const c of convs) {
        await saveDocument(uid, 'conversations', c.id, c);
      }
    }

    const rawSettings = await AsyncStorage.getItem('benku_settings');
    if (rawSettings) {
      const settings = JSON.parse(rawSettings);
      await saveDocument(uid, 'settings', 'preferences', settings);
    }

    const rawDuration = await AsyncStorage.getItem('benku_play_duration');
    if (rawDuration) {
      await saveDocument(uid, 'settings', 'playDuration', { value: Number(rawDuration) });
    }

    await AsyncStorage.setItem(MIGRATED_KEY, uid);
    console.log('Local data migrated to Firestore');
  } catch (e) {
    console.warn('Migration error:', e);
  }
}

export async function syncLoadSentences(): Promise<Sentence[]> {
  const uid = getUid();
  if (uid) {
    try {
      const cloud = await getCollection<Sentence & { id: string }>(uid, 'sentences');
      if (cloud.length > 0) {
        const mapped = cloud.map((s) => ({ ...s, id: (s as any)._localId || s.id }));
        await AsyncStorage.setItem('benku_sentences', JSON.stringify(mapped));
        return mapped;
      }
    } catch (e) {
      console.warn('Cloud load sentences failed, using local:', e);
    }
  }

  const raw = await AsyncStorage.getItem('benku_sentences');
  return raw ? JSON.parse(raw) : [];
}

export async function syncSaveSentences(sentences: Sentence[]): Promise<void> {
  await AsyncStorage.setItem('benku_sentences', JSON.stringify(sentences));
  const uid = getUid();
  if (uid) {
    try {
      for (const s of sentences) {
        await saveDocument(uid, 'sentences', s.id, { ...s, _localId: s.id });
      }
    } catch (e) {
      console.warn('Cloud save sentences failed:', e);
    }
  }
}

export async function syncLoadFolders(): Promise<string[]> {
  const uid = getUid();
  if (uid) {
    try {
      const doc = await getDocument<{ folders: string[] }>(uid, 'settings', 'folders');
      if (doc?.folders) {
        await AsyncStorage.setItem('benku_folders', JSON.stringify(doc.folders));
        return doc.folders;
      }
    } catch (e) {
      console.warn('Cloud load folders failed:', e);
    }
  }

  const raw = await AsyncStorage.getItem('benku_folders');
  return raw ? JSON.parse(raw) : [];
}

export async function syncSaveFolders(folders: string[]): Promise<void> {
  await AsyncStorage.setItem('benku_folders', JSON.stringify(folders));
  const uid = getUid();
  if (uid) {
    try {
      await saveDocument(uid, 'settings', 'folders', { folders });
    } catch (e) {
      console.warn('Cloud save folders failed:', e);
    }
  }
}

export async function syncLoadConversations(): Promise<ConversationRecord[]> {
  const uid = getUid();
  if (uid) {
    try {
      const cloud = await getCollection<ConversationRecord & { id: string }>(uid, 'conversations');
      if (cloud.length > 0) {
        await AsyncStorage.setItem('benku_conversations', JSON.stringify(cloud));
        return cloud;
      }
    } catch (e) {
      console.warn('Cloud load conversations failed:', e);
    }
  }

  const raw = await AsyncStorage.getItem('benku_conversations');
  return raw ? JSON.parse(raw) : [];
}

export async function syncSaveConversation(record: ConversationRecord): Promise<void> {
  const raw = await AsyncStorage.getItem('benku_conversations');
  const list: ConversationRecord[] = raw ? JSON.parse(raw) : [];
  list.unshift(record);
  const trimmed = list.slice(0, 200);
  await AsyncStorage.setItem('benku_conversations', JSON.stringify(trimmed));

  const uid = getUid();
  if (uid) {
    try {
      await saveDocument(uid, 'conversations', record.id, record);
    } catch (e) {
      console.warn('Cloud save conversation failed:', e);
    }
  }
}

export async function syncLoadSettings<T = Record<string, unknown>>(): Promise<T | null> {
  const uid = getUid();
  if (uid) {
    try {
      const doc = await getDocument<T>(uid, 'settings', 'preferences');
      if (doc) {
        await AsyncStorage.setItem('benku_settings', JSON.stringify(doc));
        return doc;
      }
    } catch (e) {
      console.warn('Cloud load settings failed:', e);
    }
  }

  const raw = await AsyncStorage.getItem('benku_settings');
  return raw ? JSON.parse(raw) : null;
}

export async function syncSaveSettings(settings: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem('benku_settings', JSON.stringify(settings));
  const uid = getUid();
  if (uid) {
    try {
      await saveDocument(uid, 'settings', 'preferences', settings);
    } catch (e) {
      console.warn('Cloud save settings failed:', e);
    }
  }
}

export async function syncLoadPlayDuration(): Promise<number> {
  const uid = getUid();
  if (uid) {
    try {
      const doc = await getDocument<{ value: number }>(uid, 'settings', 'playDuration');
      if (doc) {
        await AsyncStorage.setItem('benku_play_duration', String(doc.value));
        return doc.value;
      }
    } catch (e) {
      console.warn('Cloud load play duration failed:', e);
    }
  }

  const raw = await AsyncStorage.getItem('benku_play_duration');
  return raw ? Number(raw) : 0;
}

export async function syncSavePlayDuration(value: number): Promise<void> {
  await AsyncStorage.setItem('benku_play_duration', String(value));
  const uid = getUid();
  if (uid) {
    try {
      await saveDocument(uid, 'settings', 'playDuration', { value });
    } catch (e) {
      console.warn('Cloud save play duration failed:', e);
    }
  }
}

export function syncListenSentences(callback: (data: Sentence[]) => void): () => void {
  const uid = getUid();
  if (!uid) return () => {};

  return listenCollection<Sentence & { id: string }>(uid, 'sentences', (cloud) => {
    const mapped = cloud.map((s) => ({ ...s, id: (s as any)._localId || s.id }));
    AsyncStorage.setItem('benku_sentences', JSON.stringify(mapped)).catch(() => {});
    callback(mapped);
  });
}

export function syncListenConversations(callback: (data: ConversationRecord[]) => void): () => void {
  const uid = getUid();
  if (!uid) return () => {};

  return listenCollection<ConversationRecord>(uid, 'conversations', (cloud) => {
    AsyncStorage.setItem('benku_conversations', JSON.stringify(cloud)).catch(() => {});
    callback(cloud);
  });
}

export function syncListenSettings(callback: (data: Record<string, unknown> | null) => void): () => void {
  const uid = getUid();
  if (!uid) return () => {};

  return listenDocument<Record<string, unknown>>(uid, 'settings', 'preferences', (doc) => {
    if (doc) {
      AsyncStorage.setItem('benku_settings', JSON.stringify(doc)).catch(() => {});
    }
    callback(doc);
  });
}