import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

const isWeb = typeof window !== 'undefined';

const VOICE_MAP: Record<string, string> = {
  'ja-JP': 'ja-JP-NanamiNeural',
  'en-US': 'en-US-JennyNeural',
  'ko-KR': 'ko-KR-SunHiNeural',
  'fr-FR': 'fr-FR-DeniseNeural',
  'de-DE': 'de-DE-KatjaNeural',
  'es-ES': 'es-ES-ElviraNeural',
};

const WEB_SPEECH_LANG_MAP: Record<string, string> = {
  ja: 'ja-JP',
  en: 'en-US',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
};

export function getVoiceForLanguage(languageCode: string): string {
  return VOICE_MAP[languageCode] || 'ja-JP-NanamiNeural';
}

function getWebSpeechLang(languageCode?: string): string {
  if (!languageCode) return 'ja-JP';
  if (languageCode.includes('-')) return languageCode;
  return WEB_SPEECH_LANG_MAP[languageCode] || 'ja-JP';
}

function findBestVoice(lang: string): SpeechSynthesisVoice | null {
  if (!isWeb || typeof speechSynthesis === 'undefined') return null;

  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  const exactMatch = voices.find((v) => v.lang === lang);
  if (exactMatch) return exactMatch;

  const prefixMatch = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
  if (prefixMatch) return prefixMatch;

  return voices[0];
}

export async function speakWithWebSpeech(text: string, languageCode?: string): Promise<void> {
  if (!text || !text.trim()) return;

  if (!isWeb || typeof speechSynthesis === 'undefined') {
    throw new Error('Web Speech API not available');
  }

  return new Promise((resolve, reject) => {
    try {
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const lang = getWebSpeechLang(languageCode);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      const voice = findBestVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      currentUtterance = utterance;

      utterance.onend = () => {
        currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        currentUtterance = null;
        if (event.error === 'canceled' || event.error === 'interrupted') {
          resolve();
        } else {
          reject(new Error(`Web Speech error: ${event.error}`));
        }
      };

      speechSynthesis.speak(utterance);
    } catch (e) {
      reject(e);
    }
  });
}

export async function speakWithEdgeTTS(text: string, languageCode?: string): Promise<void> {
  if (!text || !text.trim()) return;

  if (isWeb && typeof speechSynthesis !== 'undefined') {
    return speakWithWebSpeech(text, languageCode);
  }

  try {
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    const voice = languageCode ? getVoiceForLanguage(languageCode) : 'ja-JP-NanamiNeural';

    const res = await fetch('/api/edge-tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Edge TTS error ${res.status}`);
    }

    const data = await res.json();
    if (!data.audioBase64) {
      throw new Error('No audio data received');
    }

    const uri = `data:audio/mp3;base64,${data.audioBase64}`;
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
    );
    currentSound = sound;
  } catch (e) {
    console.error('Edge TTS error:', e);
    throw e;
  }
}

export async function speakWord(text: string, languageCode?: string): Promise<void> {
  return speakWithEdgeTTS(text, languageCode);
}

export function stopSpeaking(): void {
  if (isWeb && typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel();
    currentUtterance = null;
    return;
  }

  if (currentSound) {
    currentSound.unloadAsync();
    currentSound = null;
  }
}