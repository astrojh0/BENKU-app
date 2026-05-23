import { Audio } from 'expo-av';

type AudioSound = ReturnType<typeof Audio.Sound.create>[0];

let currentSound: AudioSound | null = null;

const isWeb = typeof window !== 'undefined';

const VOICE_MAP: Record<string, string> = {
  'ja-JP': 'ja-JP-NanamiNeural',
  'en-US': 'en-US-JennyNeural',
  'ko-KR': 'ko-KR-SunHiNeural',
  'fr-FR': 'fr-FR-DeniseNeural',
  'de-DE': 'de-DE-KatjaNeural',
  'es-ES': 'es-ES-ElviraNeural',
};

const LOCALE_MAP: Record<string, string> = {
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

function getLocale(languageCode?: string): string {
  if (!languageCode) return 'ja-JP';
  if (languageCode.includes('-')) return languageCode;
  return LOCALE_MAP[languageCode] || 'ja-JP';
}

let _speechReady = false;

export function activateSpeechSynthesis(): void {
  if (!isWeb || !window.speechSynthesis) return;
  if (_speechReady) return;

  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    u.rate = 1;
    window.speechSynthesis.speak(u);
    _speechReady = true;
    console.log('[TTS] speechSynthesis activated');
  } catch (e) {
    console.warn('[TTS] speechSynthesis activation failed:', e);
  }
}

if (isWeb && typeof document !== 'undefined') {
  document.addEventListener('click', activateSpeechSynthesis, { once: true });
  document.addEventListener('touchstart', activateSpeechSynthesis, { once: true });
}

export function getSpeechStatus(): {
  supported: boolean;
  speaking: boolean;
  pending: boolean;
  paused: boolean;
  voiceCount: number;
  active: boolean;
} {
  if (!isWeb || !window.speechSynthesis) {
    return { supported: false, speaking: false, pending: false, paused: false, voiceCount: 0, active: false };
  }
  const synth = window.speechSynthesis;
  return {
    supported: true,
    speaking: synth.speaking,
    pending: synth.pending,
    paused: synth.paused,
    voiceCount: synth.getVoices().length,
    active: _speechReady,
  };
}

function speakWithWebSpeech(text: string, languageCode?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isWeb || !window.speechSynthesis) {
      const msg = 'Web Speech API 不可用（当前浏览器不支持 speechSynthesis）';
      console.error('[TTS]', msg);
      reject(new Error(msg));
      return;
    }

    const locale = getLocale(languageCode);
    console.log('[TTS] speakWithWebSpeech:', { text: text.slice(0, 50), locale, status: getSpeechStatus() });

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = locale;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      console.log('[TTS] utterance started:', text.slice(0, 50));
    };

    utterance.onend = () => {
      console.log('[TTS] utterance ended');
      resolve();
    };

    utterance.onerror = (event) => {
      const errMsg = event.error || 'unknown';
      console.error('[TTS] utterance error:', errMsg);
      if (errMsg === 'not-allowed') {
        reject(new Error('浏览器阻止了自动播放，请先点击页面任意位置激活语音功能'));
      } else {
        reject(new Error(`语音合成失败: ${errMsg}`));
      }
    };

    utterance.onpause = () => {
      console.log('[TTS] utterance paused');
    };

    utterance.onresume = () => {
      console.log('[TTS] utterance resumed');
    };

    window.speechSynthesis.speak(utterance);
  });
}

export async function speakWithEdgeTTS(text: string, languageCode?: string): Promise<void> {
  if (!text || !text.trim()) return;

  if (isWeb) {
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
    console.error('[TTS] Edge TTS error:', e);
    throw e;
  }
}

export async function speakWord(text: string, languageCode?: string): Promise<void> {
  return speakWithEdgeTTS(text, languageCode);
}

export function stopSpeaking(): void {
  if (isWeb && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    return;
  }

  if (currentSound) {
    currentSound.unloadAsync();
    currentSound = null;
  }
}