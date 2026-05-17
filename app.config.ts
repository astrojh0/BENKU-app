import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log('[app.config.ts] DEEPSEEK_API_KEY from env:', deepseekKey ? `${deepseekKey.slice(0, 10)}...` : 'NOT SET');
  console.log('[app.config.ts] OPENAI_API_KEY from env:', openaiKey ? `${openaiKey.slice(0, 10)}...` : 'NOT SET');
  console.log('[app.config.ts] GEMINI_API_KEY from env:', geminiKey ? `${geminiKey.slice(0, 10)}...` : 'NOT SET');
  return {
    ...config,
    extra: {
      ...(config.extra || {}),
      DEEPSEEK_API_KEY: deepseekKey,
      OPENAI_API_KEY: openaiKey,
      GEMINI_API_KEY: geminiKey,
    },
  };
};