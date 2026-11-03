import { api } from '../api';

export const SUPPORTED_LANGUAGES = [
  { key: 'en',  code: 'en',    flag: '🇺🇸', label: 'US EN',  name: 'English',              short: 'EN',  tag: 'English' },
  { key: 'bis', code: 'ceb',   flag: '🇵🇭', label: 'PH BIS', name: 'Bisaya (Cebuano)',     short: 'BIS', tag: 'Cebuano' },
  { key: 'tgl', code: 'tl',    flag: '🇵🇭', label: 'PH TAG', name: 'Tagalog (Filipino)',    short: 'TAG', tag: 'Filipino' },
  { key: 'es',  code: 'es',    flag: '🇪🇸', label: 'ES ESP', name: 'Español (Spanish)',     short: 'ES',  tag: 'Spanish' },
  { key: 'ja',  code: 'ja',    flag: '🇯🇵', label: 'JP JPN', name: '日本語 (Japanese)',      short: 'JA',  tag: 'Japanese' },
  { key: 'ko',  code: 'ko',    flag: '🇰🇷', label: 'KR KOR', name: '한국어 (Korean)',        short: 'KO',  tag: 'Korean' },
  { key: 'zh',  code: 'zh-CN', flag: '🇨🇳', label: 'CN CHN', name: '中文 (Chinese)',         short: 'ZH',  tag: 'Chinese' },
  { key: 'fr',  code: 'fr',    flag: '🇫🇷', label: 'FR FRA', name: 'Français (French)',      short: 'FR',  tag: 'French' },
  { key: 'de',  code: 'de',    flag: '🇩🇪', label: 'DE DEU', name: 'Deutsch (German)',       short: 'DE',  tag: 'German' },
  { key: 'ar',  code: 'ar',    flag: '🇸🇦', label: 'SA ARB', name: 'العربية (Arabic)',      short: 'AR',  tag: 'Arabic' },
  { key: 'ilo', code: 'ilo',   flag: '🇵🇭', label: 'PH ILO', name: 'Ilokano',               short: 'ILO', tag: 'Ilokano' },
  { key: 'hil', code: 'hil',   flag: '🇵🇭', label: 'PH HIL', name: 'Hiligaynon (Ilonggo)',  short: 'HIL', tag: 'Hiligaynon' },
  { key: 'it',  code: 'it',    flag: '🇮🇹', label: 'IT ITA', name: 'Italiano (Italian)',     short: 'IT',  tag: 'Italian' },
  { key: 'id',  code: 'id',    flag: '🇮🇩', label: 'ID IND', name: 'Bahasa Indonesia',      short: 'ID',  tag: 'Indonesian' },
];

export const PRIMARY_LANG_KEYS = ['en', 'bis', 'tgl', 'es', 'ja', 'zh'];

export function getLangByKey(key) {
  if (!key) return SUPPORTED_LANGUAGES[0];
  const k = key.toLowerCase();
  return SUPPORTED_LANGUAGES.find(l => l.key === k || l.code.toLowerCase() === k || l.short.toLowerCase() === k) || SUPPORTED_LANGUAGES[0];
}

const clientTranslationCache = new Map();

/**
 * Enterprise client-and-server translation utility.
 * Translates any message dynamically to the target language.
 */
export async function translateMessageText(text, targetLangKey = 'en') {
  if (!text || typeof text !== 'string') return text;
  
  const targetObj = getLangByKey(targetLangKey);
  const targetCode = targetObj.code;

  const cacheKey = `${targetCode}:${text.trim()}`;
  if (clientTranslationCache.has(cacheKey)) {
    return clientTranslationCache.get(cacheKey);
  }

  // 1. Try browser-level Google Translate GTX endpoint (instant, free, zero keys)
  try {
    const clean = text
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetCode)}&dt=t&q=${encodeURIComponent(clean)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(s => s[0]).join('');
        if (translated && translated.trim()) {
          clientTranslationCache.set(cacheKey, translated);
          return translated;
        }
      }
    }
  } catch (clientErr) {
    // Client direct network blocked by ad-blocker or CORS, fallback to API proxy
  }

  // 2. Try Backend API Translation Proxy
  try {
    const res = await api.chatbot.translate(text, targetCode);
    if (res && res.translatedText) {
      clientTranslationCache.set(cacheKey, res.translatedText);
      return res.translatedText;
    }
  } catch (apiErr) {
    console.warn('[translateMessageText] Backend proxy failed:', apiErr);
  }

  return text;
}
