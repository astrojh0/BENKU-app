import { Sentence, createSentenceFromFields } from '../models/sentence';
import {
  syncLoadSentences,
  syncSaveSentences,
  syncLoadFolders,
  syncSaveFolders,
} from '../services/sync';

export async function loadSentences(): Promise<Sentence[]> {
  try {
    return await syncLoadSentences();
  } catch (e) {
    console.warn('loadSentences error', e);
    return [];
  }
}

export async function saveSentences(sentences: Sentence[]): Promise<void> {
  try {
    await syncSaveSentences(sentences);
  } catch (e) {
    console.warn('saveSentences error', e);
  }
}

export async function addSentence(fields: Partial<Sentence>): Promise<Sentence> {
  const current = await loadSentences();
  const s = createSentenceFromFields(fields);
  const next = [s, ...current];
  await saveSentences(next);
  return s;
}

export async function updateSentence(id: string, patch: Partial<Sentence>): Promise<Sentence | null> {
  const list = await loadSentences();
  let updated: Sentence | null = null;
  const next = list.map((s) => {
    if (s.id === id) {
      updated = { ...s, ...patch };
      return updated;
    }
    return s;
  });
  if (updated) await saveSentences(next);
  return updated;
}

export async function deleteSentence(id: string): Promise<void> {
  const list = await loadSentences();
  const next = list.filter((s) => s.id !== id);
  await saveSentences(next);
}

export async function getSubfolders(): Promise<string[]> {
  const list = await loadSentences();
  const set = new Set<string>();
  list.forEach((s) => {
    if (s.subFolder) set.add(s.subFolder);
  });
  try {
    const persisted = await syncLoadFolders();
    persisted.forEach((f) => f && set.add(f));
  } catch (e) {
    // ignore
  }
  return Array.from(set);
}

export async function renameSubfolder(oldName: string, newName: string): Promise<void> {
  const list = await loadSentences();
  const next = list.map((s) => (s.subFolder === oldName ? { ...s, subFolder: newName } : s));
  await saveSentences(next);
  try {
    const persisted = await syncLoadFolders();
    const updated = persisted.map((f) => (f === oldName ? newName : f));
    if (!updated.includes(newName)) updated.push(newName);
    await syncSaveFolders(Array.from(new Set(updated)));
  } catch (e) {
    // ignore
  }
}

export async function deleteSubfolder(name: string): Promise<void> {
  const list = await loadSentences();
  const next = list.map((s) => (s.subFolder === name ? { ...s, subFolder: null } : s));
  await saveSentences(next);
  try {
    const persisted = await syncLoadFolders();
    const updated = persisted.filter((f) => f !== name);
    await syncSaveFolders(updated);
  } catch (e) {
    // ignore
  }
}

export async function loadFolders(): Promise<string[]> {
  try {
    return await syncLoadFolders();
  } catch (e) {
    return [];
  }
}

export async function addFolder(name: string): Promise<void> {
  if (!name) return;
  try {
    const list = await loadFolders();
    const next = Array.from(new Set([...list, name]));
    await syncSaveFolders(next);
  } catch (e) {}
}

export async function moveSentenceToFolder(id: string, folder: string | null): Promise<Sentence | null> {
  return updateSentence(id, { subFolder: folder });
}

export async function addTagToSentence(id: string, tag: string): Promise<Sentence | null> {
  const s = await updateSentence(id, {} as any);
  if (!s) return null;
  if (!s.tags.includes(tag)) s.tags = [...s.tags, tag];
  await updateSentence(id, { tags: s.tags });
  return s;
}

export async function removeTagFromSentence(id: string, tag: string): Promise<Sentence | null> {
  const s = await updateSentence(id, {} as any);
  if (!s) return null;
  const tags = s.tags.filter((t) => t !== tag);
  await updateSentence(id, { tags });
  return { ...s, tags };
}

export async function toggleMastered(id: string): Promise<Sentence | null> {
  const s = await updateSentence(id, {} as any);
  if (!s) return null;
  const next = { ...s, mastered: !s.mastered };
  await updateSentence(id, { mastered: next.mastered });
  return next;
}

export async function getStats() {
  const list = await loadSentences();
  const total = list.length;
  const mastered = list.filter((s) => s.mastered).length;
  const tags: Record<string, number> = {};
  list.forEach((s) => s.tags.forEach((t) => (tags[t] = (tags[t] || 0) + 1)));
  return { total, mastered, tags };
}