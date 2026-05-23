exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Gemini API key not configured. Set GEMINI_API_KEY in Netlify environment variables.' }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: body.system_instruction,
          contents: body.contents || [],
          generationConfig: body.generationConfig || { temperature: 0.6, maxOutputTokens: 2000 },
        }),
      },
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[gemini-proxy] Upstream error:', upstream.status, errText);
      return {
        statusCode: upstream.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Gemini API error ${upstream.status}: ${errText}` }),
      };
    }

    const data = await upstream.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: String(content).trim() }),
    };
  } catch (e) {
    console.error('[gemini-proxy] Error:', e);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Gemini request failed: ' + e.message }),
    };
  }
};