// OpenAI API 代理 (Vercel 格式)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key not configured. Set OPENAI_API_KEY in Vercel environment variables.' });
  }

  const { messages, temperature, max_tokens } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Missing messages in request body' });
  }

  // 超时控制 - 15秒
  const TIMEOUT_MS = 15000;
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), TIMEOUT_MS)
  );

  try {
    console.log('[openai-proxy] 收到请求');

    const upstream = await Promise.race([
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: messages,
          temperature: temperature ?? 0.6,
          max_tokens: max_tokens ?? 2000,
        }),
      }),
      timeout
    ]);

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[openai-proxy] Upstream error:', upstream.status, errText);
      return res.status(upstream.status).json({ error: `OpenAI API error ${upstream.status}: ${errText}` });
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content || '';

    console.log('[openai-proxy] 成功返回');

    return res.status(200).json({ content: String(content).trim() });
  } catch (e) {
    console.error('[openai-proxy] Error:', e.message);
    if (e.message === 'Request timeout') {
      return res.status(504).json({ error: 'Request timeout. Please check your network connection.' });
    }
    return res.status(500).json({ error: 'OpenAI request failed: ' + e.message });
  }
};
