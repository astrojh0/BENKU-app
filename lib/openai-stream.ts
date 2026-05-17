export type SentenceResponse = {
  sentence: string;
  translation: string;
  tags?: string[];
  audio?: string;
};

export type GenerateSentenceOptions = {
  endpointUrl: string;
  scenario: string;
  prompt?: string;
  signal?: AbortSignal;
};

export async function generateSentence({
  endpointUrl,
  scenario,
  prompt,
  signal,
}: GenerateSentenceOptions): Promise<SentenceResponse> {
  const res = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ scenario, prompt }),
    signal,
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = res.statusText;
    const ct = res.headers.get('content-type') ?? '';
    try {
      if (ct.includes('application/json')) {
        const errJson = (await res.json()) as { error?: string };
        if (errJson?.error) detail = errJson.error;
      } else {
        const t = await res.text();
        if (t) detail = t;
      }
    } catch {
      // ignore
    }
    throw new Error(detail || `Request failed (${res.status})`);
  }

  const payload = await res.json();
  return payload as SentenceResponse;
}
