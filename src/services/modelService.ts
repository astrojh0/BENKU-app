import { ModelType } from '../../app/components/ModelSelector';
import { QueryMode, sendMessageToDeepSeek, SentenceResponse } from './deepseek';
import { sendMessageToGemini } from './gemini';
import { sendMessageToOpenAI } from './openai';

export async function sendMessage(
  userMessage: string,
  targetLang: string,
  mode: QueryMode,
  model: ModelType,
): Promise<SentenceResponse> {
  switch (model) {
    case 'deepseek':
      return sendMessageToDeepSeek(userMessage, targetLang, mode);
    case 'openai':
      return sendMessageToOpenAI(userMessage, targetLang, mode);
    case 'gemini':
      return sendMessageToGemini(userMessage, targetLang, mode);
    default:
      return sendMessageToDeepSeek(userMessage, targetLang, mode);
  }
}