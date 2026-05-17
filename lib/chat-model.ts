import AsyncStorage from '@react-native-async-storage/async-storage';

export const SENTENCES_STORAGE_KEY = 'ocat_sentences';

export type Sentence = {
  id: string;
  text: string;
  translation: string;
  audio?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export interface SentenceRepository {
  loadSentences(): Promise<Sentence[]>;
  saveSentences(sentences: Sentence[]): Promise<void>;
}

const defaultId = () =>
  typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
    ? (crypto as any).randomUUID()
    : `sentence-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function createSentence(
  text: string,
  translation: string,
  tags: string[] = [],
  audio?: string,
  id = defaultId(),
): Sentence {
  const timestamp = Date.now();
  return {
    id,
    text,
    translation,
    audio,
    tags,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function updateSentence(sentence: Sentence, updates: Partial<Omit<Sentence, 'id'>>): Sentence {
  return {
    ...sentence,
    ...updates,
    updatedAt: Date.now(),
  };
}

export async function loadSentences(): Promise<Sentence[]> {
  try {
    const item = await AsyncStorage.getItem(SENTENCES_STORAGE_KEY);
    if (!item) return [];

    const parsed = JSON.parse(item) as Sentence[];
    if (!Array.isArray(parsed)) return [];

    return parsed.map((sentence) => ({
      ...sentence,
      createdAt: typeof sentence.createdAt === 'number' ? sentence.createdAt : Date.now(),
      updatedAt: typeof sentence.updatedAt === 'number' ? sentence.updatedAt : Date.now(),
      tags: Array.isArray(sentence.tags) ? sentence.tags.filter((tag) => typeof tag === 'string') : [],
    }));
  } catch {
    return [];
  }
}

export async function saveSentences(sentences: Sentence[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(sentences));
  } catch {
    // Ignore persistence errors so the app stays functional.
  }
}
