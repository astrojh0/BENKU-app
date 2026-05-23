import { QueryMode, SentenceResponse } from './deepseek';

function buildSystemPrompt(targetLang: string, mode: QueryMode, nativeLanguage: string = '中文'): string {
  const langName = targetLang === 'ja' ? '日语' : targetLang === 'en' ? '英语' : targetLang === 'ko' ? '韩语' : targetLang === 'fr' ? '法语' : targetLang === 'de' ? '德语' : targetLang === 'es' ? '西班牙语' : '目标语言';

  if (mode === 'translate') {
    return `用户的母语是${nativeLanguage}。你是一个专业的语言老师。用户会用母语问"xxx用${langName}怎么说"。你必须严格按照以下 Markdown 格式输出，不得省略任何章节（如果目标语言没有敬语概念，则写"敬语版：同口语版"）：

**口语版：**
[句子]

**敬语版：**
[句子或"同口语版"]

**解析：**
单词1 (读音) ：词性，解释。
单词2 (读音) ：词性，解释。
（至少3个，如果句子太短则列出所有实词）

**其他句型：**
更自然的说法： [句子]
[简短解释]
更礼貌的说法： [句子]
[简短解释]

**如何回答：**（如果用户问的是疑问句，必填；否则可写"无需回答"）
[典型的回答句子]

**翻译练习：**
请将以下句子翻译成${langName}：
「[一个相关的中文句子]」

**参考答案：**
[目标语言的句子]

格式规则（必须严格遵守）：
- 每个章节标题必须用 **加粗** 单独一行。
- 标题下方的目标语言句子必须单独一行，不要加粗，不要加任何标记。
- 解析部分：每行格式为"单词 (读音) ：词性，解释。"，不要用数字编号，不要加粗。
- 其他句型：每个子标题单独一行，目标语言句子在子标题同一行或下一行，不要加粗。
- 不要使用代码块（\`\`\`）。
- 不要输出任何开场白（如"好的"、"以下是翻译"）或结束语。`;
  }

  if (mode === 'explain') {
    return `你是${langName}词汇/语法解释专家。用户提供${langName}单词或句子，你需要解释它的中文意思、用法、例句等。请用清晰的 Markdown 格式输出，不要用代码块。

释义：
[用中文解释该单词/句子的意思]

解析：
1. [如果是单词：读音、词性、用法说明]
2. [如果是句子：逐词拆解，每个词的读音和意思]

例句：
1. [例句1的${langName}]
   [中文翻译]
2. [例句2的${langName}]
   [中文翻译]

注意点：
- [使用时的注意事项、常见错误等]
- [相关表达或近义词辨析]

输出格式要求：
- 保持专业、清晰、易于阅读。
- 不要输出额外的开场白或结束语。`;
  }

  return `你是${langName}学习助手。只回答与${langName}学习相关的问题（语法、词汇、发音、文化等）。如果用户问无关内容，请礼貌回答："对不起，我只帮助${langName}学习相关问题。" 请用清晰的 Markdown 格式输出，不要用代码块。`;
}

const isWeb = typeof window !== 'undefined';

export async function sendMessageToGemini(
  userMessage: string,
  targetLang: string,
  mode: QueryMode,
  nativeLanguage: string = '中文',
): Promise<SentenceResponse> {
  if (!userMessage || !userMessage.trim()) {
    throw new Error('userMessage required');
  }

  const systemPrompt = buildSystemPrompt(targetLang, mode, nativeLanguage);

  const endpoint = isWeb ? '/api/gemini-proxy' : '/api/gemini';

  console.log('[Gemini] Sending request:', {
    targetLang,
    mode,
    endpoint,
    userMessage: userMessage.trim().slice(0, 100),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userMessage.trim() }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 2000 },
      }),
      signal: controller.signal,
    });

    console.log('[Gemini] Response status:', res.status);

    if (!res.ok) {
      const text = await res.text();
      console.warn('[Gemini] API error response:', text);
      throw new Error(`Gemini API error ${res.status}: ${text}`);
    }

    const data = await res.json().catch((e) => {
      console.warn('[Gemini] JSON parse error:', e);
      throw new Error('Failed to parse Gemini response JSON: ' + String(e));
    });

    if (data.error) {
      console.warn('[Gemini] API returned error:', data.error);
      throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
    }

    const content = data.content || '';

    console.log('[Gemini] Response content length:', content.length);

    return { content: String(content).trim(), raw: data };
  } finally {
    clearTimeout(timeoutId);
  }
}