const { getDefaultConfig } = require('expo/metro-config');
const fs = require('node:fs');
const path = require('node:path');
const { ProxyAgent } = require('undici');
const { Communicate } = require('edge-tts-universal');

const config = getDefaultConfig(__dirname);

const PROXY_URL = 'http://127.0.0.1:7890';
const proxyAgent = new ProxyAgent({ uri: PROXY_URL });

console.log('[metro.config.js] Proxy agent configured:', PROXY_URL);

function findProjectRoot() {
  let dir = __dirname;
  for (let i = 0; i < 32; i++) {
    if (fs.existsSync(path.join(dir, 'app.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return __dirname;
}

function loadEnv() {
  const projectRoot = findProjectRoot();
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim();
      }
    }
  }
}

loadEnv();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

console.log('[metro.config.js] OPENAI_API_KEY:', OPENAI_API_KEY ? `${OPENAI_API_KEY.slice(0, 10)}...` : 'NOT SET');
console.log('[metro.config.js] GEMINI_API_KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.slice(0, 10)}...` : 'NOT SET');

config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      if (req.url === '/api/openai' && req.method === 'POST') {
        if (!OPENAI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: parsed.messages || [],
                temperature: parsed.temperature ?? 0.6,
                max_tokens: parsed.max_tokens ?? 2000,
              }),
              dispatcher: proxyAgent,
            });

            if (!upstream.ok) {
              const errText = await upstream.text();
              console.error('[metro] OpenAI upstream error:', upstream.status, errText);
              res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `OpenAI API error ${upstream.status}: ${errText}` }));
              return;
            }

            const data = await upstream.json();
            const content = data?.choices?.[0]?.message?.content || '';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content: String(content).trim() }));
          } catch (e) {
            console.error('[metro] OpenAI proxy error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'OpenAI request failed: ' + e.message }));
          }
        });
        return;
      }

      if (req.url === '/api/gemini' && req.method === 'POST') {
        if (!GEMINI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Gemini API key not configured. Please set GEMINI_API_KEY in .env file.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const upstream = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  system_instruction: parsed.system_instruction,
                  contents: parsed.contents || [],
                  generationConfig: parsed.generationConfig || { temperature: 0.6, maxOutputTokens: 2000 },
                }),
                dispatcher: proxyAgent,
              },
            );

            if (!upstream.ok) {
              const errText = await upstream.text();
              console.error('[metro] Gemini upstream error:', upstream.status, errText);
              res.writeHead(upstream.status, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: `Gemini API error ${upstream.status}: ${errText}` }));
              return;
            }

            const data = await upstream.json();
            const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content: String(content).trim() }));
          } catch (e) {
            console.error('[metro] Gemini proxy error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Gemini request failed: ' + e.message }));
          }
        });
        return;
      }

      if (req.url === '/api/edge-tts' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body);
            const text = parsed.text || '';
            if (!text.trim()) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'text is required' }));
              return;
            }

            const communicate = new Communicate(text, {
              voice: parsed.voice || 'ja-JP-NanamiNeural',
              proxy: PROXY_URL,
            });

            const audioChunks = [];
            for await (const chunk of communicate.stream()) {
              if (chunk.type === 'audio' && chunk.data) {
                audioChunks.push(chunk.data);
              }
            }

            if (audioChunks.length === 0) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'No audio received from Edge TTS' }));
              return;
            }

            const audioBuffer = Buffer.concat(audioChunks);
            const base64 = audioBuffer.toString('base64');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ audioBase64: base64 }));
          } catch (e) {
            console.error('[metro] Edge TTS proxy error:', e);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Edge TTS request failed: ' + e.message }));
          }
        });
        return;
      }

      return middleware(req, res, next);
    };
  },
};

module.exports = config;