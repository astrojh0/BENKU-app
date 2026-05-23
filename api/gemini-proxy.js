// Gemini API 代理 (Vercel 格式)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in Vercel environment variables.' });
  }

  const { system_instruction, contents, generationConfig } = req.body;

  if (!contents) {
    return res.status(400).json({ error: 'Missing contents in request body' });
  }

  // 超时控制 - 15秒
  const TIMEOUT_MS = 15000;
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS)
  );

  try {
    console.log('[gemini-proxy] 收到请求');

    const upstream = await Promise.race([
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: system_instruction,
            contents: contents,
            generationConfig: generationConfig || { temperature: 0.6, maxOutputTokens: 2000 },
          }),
        }
      ),
      timeout
    ]);

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[gemini-proxy] Upstream error:', upstream.status, errText);
      return res.status(upstream.status).json({ error: `Gemini API error ${upstream.status}: ${errText}` });
    }

    const data = await upstream.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('[gemini-proxy] 成功返回');

    return res.status(200).json({ content: String(content).trim() });
  } catch (e) {
    console.error('[gemini-proxy] Error:', e.message);
    if (e.message === 'Request timeout') {
      return res.status(504).json({ error: 'Request timeout. Please check your network connection.' });
    }
    return res.status(500).json({ error: 'Gemini request failed: ' + e.message });
  }
};
