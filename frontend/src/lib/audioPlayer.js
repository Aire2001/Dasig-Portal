import { getLangByKey } from './languages.js';
import { api } from '../api.js';

function splitIntoAudioChunks(text, maxLen = 130) {
  if (!text) return [];

  // Split on paragraph or sentence boundaries (including Chinese/Japanese/Western punctuation)
  const rawParts = text
    .split(/([。！？!?\n]+|[.][\s]+)/)
    .filter(Boolean);

  const sentences = [];
  let buffer = '';

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (buffer.length + part.length <= maxLen) {
      buffer += part;
    } else {
      if (buffer.trim()) sentences.push(buffer.trim());
      buffer = part;
    }
  }
  if (buffer.trim()) sentences.push(buffer.trim());

  // If any sentence is still longer than maxLen, split cleanly on commas, semicolons, or spaces
  const finalChunks = [];
  for (const s of sentences) {
    if (s.length <= maxLen) {
      finalChunks.push(s);
    } else {
      const sub = s.split(/([，,;；、\s]+)/).filter(Boolean);
      let subBuf = '';
      for (const p of sub) {
        if (subBuf.length + p.length <= maxLen) {
          subBuf += p;
        } else {
          if (subBuf.trim()) finalChunks.push(subBuf.trim());
          subBuf = p;
        }
      }
      if (subBuf.trim()) finalChunks.push(subBuf.trim());
    }
  }

  return finalChunks.filter(c => c && c.trim().length > 0);
}

class MultilingualVoicePlayer {
  constructor() {
    this.audio = null;
    this.currentIdx = null;
    this.onStateChange = null;
    this.isCancelled = false;
  }

  stop() {
    this.isCancelled = true;
    if (this.audio) {
      try { this.audio.pause(); } catch (_) {}
      this.audio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    this.currentIdx = null;
    if (this.onStateChange) this.onStateChange(null);
  }

  async play(idx, text, langKey = 'en', onStateChange) {
    this.onStateChange = onStateChange;

    if (this.currentIdx === idx) {
      this.stop();
      return;
    }

    this.stop();
    this.isCancelled = false;
    this.currentIdx = idx;
    if (this.onStateChange) this.onStateChange(idx);

    const cleanText = (text || '')
      .replace(/https?:\/\/\S+/gi, '')
      .replace(/[\*\_\~`#]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/^[•▸\-\*\d+\.]\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) {
      this.stop();
      return;
    }

    const langObj = getLangByKey(langKey);
    const targetCode = (langObj.code || 'en').toLowerCase();
    const targetBcp47 = (langObj.bcp47 || 'en-US').toLowerCase();

    // 1. Try Browser SpeechSynthesis if native voice exists for target language
    const voices = (typeof window !== 'undefined' && 'speechSynthesis' in window)
      ? window.speechSynthesis.getVoices() || []
      : [];

    const matchedVoice =
      voices.find(v => v.lang && v.lang.toLowerCase() === targetBcp47) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith(targetCode.slice(0, 2))) ||
      voices.find(v => v.lang && v.lang.toLowerCase().includes(targetCode.slice(0, 2)));

    if (matchedVoice && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.lang = langObj.bcp47 || 'en-US';
      utter.voice = matchedVoice;
      utter.rate = 1.0;
      utter.onend = () => this.stop();
      utter.onerror = () => this.stop();
      window.speechSynthesis.speak(utter);
      return;
    }

    // 2. Play Sequential Queue of Native Cloud Neural Audio Chunks (Full Text, Never Cut Off)
    const chunks = splitIntoAudioChunks(cleanText, 130);
    if (!chunks.length) {
      this.stop();
      return;
    }

    let chunkIndex = 0;

    const playNextChunk = async () => {
      if (this.isCancelled || this.currentIdx !== idx || chunkIndex >= chunks.length) {
        this.stop();
        return;
      }

      const segment = chunks[chunkIndex];
      chunkIndex++;

      try {
        const res = await api.chatbot.tts(segment, langObj.code);
        const contentType = res.headers?.get('content-type') || '';
        if (res.ok && contentType.includes('audio/mpeg') && !this.isCancelled) {
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.audio = audio;
          audio.onended = () => {
            try { URL.revokeObjectURL(audioUrl); } catch (_) {}
            playNextChunk();
          };
          audio.onerror = () => playNextChunk();
          await audio.play();
          return;
        }
      } catch (_) {
        // Fall back to direct audio stream
      }

      if (this.isCancelled) return;

      const directUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(langObj.code)}&client=tw-ob&q=${encodeURIComponent(segment)}`;
      const audio = new Audio(directUrl);
      this.audio = audio;
      audio.onended = () => playNextChunk();
      audio.onerror = () => playNextChunk();
      audio.play().catch(() => playNextChunk());
    };

    playNextChunk();
  }
}

export const voicePlayer = new MultilingualVoicePlayer();
