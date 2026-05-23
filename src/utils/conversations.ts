import { syncLoadConversations, syncSaveConversation } from '../services/sync';

const CONVERSATIONS_KEY = 'benku_conversations';

export interface ConversationRecord {
  id: string;
  sourceConversationId: string;
  userInput: string;
  targetLang: string;
  aiResponse: {
    sentence: string;
    translation: string;
    kana?: string;
    audio?: string;
    content?: string;
  };
  createdAt: number;
}

export async function saveConversation(record: ConversationRecord): Promise<void> {
  try {
    await syncSaveConversation(record);
  } catch (e) {
    console.warn('saveConversation error', e);
  }
}

export async function getConversation(sourceConversationId: string): Promise<ConversationRecord | null> {
  try {
    const list = await syncLoadConversations();
    return list.find((c) => c.sourceConversationId === sourceConversationId) || null;
  } catch (e) {
    console.warn('getConversation error', e);
    return null;
  }
}

export async function getAllConversations(): Promise<ConversationRecord[]> {
  try {
    const list = await syncLoadConversations();
    let migrated = false;
    for (const c of list) {
      if (!c.aiResponse) {
        c.aiResponse = { sentence: '', translation: '', content: '' };
        migrated = true;
      }
      if (!c.createdAt) {
        c.createdAt = Date.now();
        migrated = true;
      }
    }
    if (migrated) {
      await syncSaveConversation(list[0] || { id: '', sourceConversationId: '', userInput: '', targetLang: '', aiResponse: { sentence: '', translation: '' }, createdAt: Date.now() });
    }
    return list;
  } catch (e) {
    console.warn('getAllConversations error', e);
    return [];
  }
}