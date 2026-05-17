import Constants from 'expo-constants';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

function getDeepSeekApiKey() {
  const expoConstants = Constants.expoConfig || Constants.manifest || {};
  const extra = expoConstants.extra || {};
  const apiKey = extra.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error(
      'Missing DEEPSEEK_API_KEY. 请在项目根目录的 .env 中添加 DEEPSEEK_API_KEY=你的API密钥，并重启开发服务器。',
    );
  }

  return apiKey.trim();
}

export async function sendMessageToDeepSeek(userMessage) {
  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
    throw new Error('sendMessageToDeepSeek requires a non-empty user message.');
  }

  const apiKey = getDeepSeekApiKey();

  const payload = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant for a React Native app. Answer clearly and concisely.',
      },
      {
        role: 'user',
        content: userMessage.trim(),
      },
    ],
    max_tokens: 256,
    temperature: 0.7,
  };

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content || data?.output_text || '';

  if (!reply || typeof reply !== 'string') {
    throw new Error('DeepSeek API did not return a valid text response.');
  }

  return reply.trim();
}
