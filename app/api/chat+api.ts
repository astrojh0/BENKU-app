import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env from the Expo project root (where app.json lives).
function findProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 32; i++) {
    if (fs.existsSync(path.join(dir, 'app.json'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const projectRoot = findProjectRoot();
const envPaths = [path.join(projectRoot, '.env'), path.join(process.cwd(), '.env')];
for (const p of envPaths) {
  try {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  } catch {}
}

if (!process.env.DEEPSEEK_API_KEY) {
  for (const p of envPaths) {
    try {
      if (!fs.existsSync(p)) continue;
      const text = fs.readFileSync(p, 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^DEEPSEEK_API_KEY=(.*)$/);
        if (m) {
          process.env.DEEPSEEK_API_KEY = m[1];
          break;
        }
      }
      if (process.env.DEEPSEEK_API_KEY) break;
    } catch {}
  }
}

type SentenceResponse = {
  sentence: string;
  translation: string;
  tags?: string[];
  audio?: string;
};

function mergeCors(request: Request, headers: Headers): void {
  const origin = request.headers.get('origin');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Vary', 'Origin');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
}

function jsonWithCors(request: Request, data: unknown, status: number) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  mergeCors(request, headers);
  return Response.json(data, { status, headers });
}

export function OPTIONS(request: Request) {
  const headers = new Headers();
  mergeCors(request, headers);
  return new Response(null, { status: 204, headers });
}

function createMockResponse(request: Request, scenario: string) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8' });
  mergeCors(request, headers);
  return new Response(
    JSON.stringify({
      sentence: `A simple sentence for ${scenario}.`,
      translation: `A simple sentence for ${scenario}.`,
      tags: [scenario],
      audio: undefined,
    }),
    { status: 200, headers },
  );
}

function isTrueFlag(value: unknown): boolean {
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

export async function POST(request: Request) {
  const useMock = isTrueFlag(process.env.USE_MOCK);
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  try {
    // Masked log: don't print secret, only presence and length
    // eslint-disable-next-line no-console
    console.log(
      '[chat+api] DEEPSEEK_API_KEY present=',
      !!apiKey,
      'len=',
      apiKey ? apiKey.length : 0,
      'USE_MOCK=',
      useMock,
      'projectRoot=',
      projectRoot,
      '.env exists=',
      fs.existsSync(path.join(projectRoot, '.env')),
    );
  } catch {}

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    if (useMock) {
      return createMockResponse(request, 'general');
    }
    return jsonWithCors(request, { error: 'Invalid JSON body' }, 400);
  }

  const scenarioRaw = (body as { scenario?: unknown }).scenario;
  const promptRaw = (body as { prompt?: unknown }).prompt;
  const scenario = typeof scenarioRaw === 'string' && scenarioRaw.trim() ? scenarioRaw.trim() : 'general';
  const prompt = typeof promptRaw === 'string' && promptRaw.trim() ? promptRaw.trim() : '';

  if (useMock) {
    return createMockResponse(request, scenario);
  }

  if (!apiKey) {
    return jsonWithCors(
      request,
      {
        error:
          'Missing DEEPSEEK_API_KEY on the server. Set the DEEPSEEK_API_KEY environment variable and restart the server.',
      },
      500,
    );
  }

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 10000);
  if (request.signal) {
    request.signal.addEventListener('abort', () => ac.abort());
  }

  let upstream: Response | null = null;
  try {
    const userPrompt =
      prompt ||
      `Generate a single example sentence for the "${scenario}" scenario. Return only valid JSON with keys: sentence, translation, tags, and optional audio. The translation should be in English.`;
    upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              'You are a language learning assistant. Always reply with valid JSON containing sentence, translation, tags, and optional audio.',
          },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
      signal: ac.signal,
    });
  } catch {
    clearTimeout(timeout);
    return createMockResponse(request, scenario);
  } finally {
    clearTimeout(timeout);
  }

  if (!upstream?.ok) {
    return createMockResponse(request, scenario);
  }

  let json: unknown;
  try {
    json = await upstream.json();
  } catch {
    return createMockResponse(request, scenario);
  }

  const content =
    (json as any)?.choices?.[0]?.message?.content || (json as any)?.choices?.[0]?.text;
  if (typeof content !== 'string' || !content.trim()) {
    return createMockResponse(request, scenario);
  }

  const trimmed = content.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return jsonWithCors(request, parsed, 200);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}$/m);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return jsonWithCors(request, parsed, 200);
      } catch {
        // fall through to fallback
      }
    }
  }

  return createMockResponse(request, scenario);
}
