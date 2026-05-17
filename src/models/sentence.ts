export interface Sentence {
  id: string;
  text: string;
  translation: string;
  kana?: string | null;
  audioUrl?: string | null;
  tags: string[];
  subFolder: string | null;
  mastered: boolean;
  createdAt: number;
  sourceConversationId: string | null;
}

export function createSentenceFromFields(fields: Partial<Sentence> = {}): Sentence {
  const now = Date.now();
  return {
    id: fields.id || `sent_${now}_${Math.random().toString(36).slice(2, 9)}`,
    text: fields.text || '',
    translation: fields.translation || '',
    kana: fields.kana ?? null,
    audioUrl: fields.audioUrl ?? null,
    tags: fields.tags || [],
    subFolder: fields.subFolder ?? null,
    mastered: fields.mastered ?? false,
    createdAt: fields.createdAt || now,
    sourceConversationId: fields.sourceConversationId ?? null,
  };
}
