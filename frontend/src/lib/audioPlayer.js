import { getLangByKey } from './languages.js';
import { api } from '../api.js';

class MultilingualVoicePlayer {
  constructor() {
    this.audio = null;
    this.currentIdx = null;
    this.onStateChange = null;
  }

  stop() {
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

    // 1. Try Backend Cloud Neural Audio Proxy (works everywhere, true native accent)
    try {
      const res = await api.chatbot.tts(cleanText.slice(0, 300), langObj.code);
      const contentType = res.headers?.get('content-type') || '';
      if (res.ok && contentType.includes('audio/mpeg')) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        this.audio = audio;
        audio.onended = () => this.stop();
        audio.onerror = () => this.fallbackPlay(cleanText, langObj, targetCode, targetBcp47);
        await audio.play();
        return;
      }
    } catch (_) {
      // Fallback to client browser audio
    }

    this.fallbackPlay(cleanText, langObj, targetCode, targetBcp47);
  }

  fallbackPlay(cleanText, langObj, targetCode, targetBcp47) {
    // 2. Try Browser SpeechSynthesis if native voice exists for target language
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

    // 3. Direct Google Translate TTS client audio
    const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleanText];
    const segment = (sentences[0] || cleanText).slice(0, 180);
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(langObj.code)}&client=tw-ob&q=${encodeURIComponent(segment)}`;

    const audio = new Audio(url);
    this.audio = audio;
    audio.onended = () => this.stop();
    audio.onerror = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = langObj.bcp47 || 'en-US';
        utter.onend = () => this.stop();
        utter.onerror = () => this.stop();
        window.speechSynthesis.speak(utter);
      } else {
        this.stop();
      }
    };
    audio.play().catch(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = langObj.bcp47 || 'en-US';
        utter.onend = () => this.stop();
        utter.onerror = () => this.stop();
        window.speechSynthesis.speak(utter);
      } else {
        this.stop();
      }
    });
  }
}

export const voicePlayer = new MultilingualVoicePlayer();
