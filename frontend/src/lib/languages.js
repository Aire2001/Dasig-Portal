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

export function getLocalizedGreeting(user, langKey = 'en') {
  const first = user?.name ? user.name.split(' ')[0] : '';
  const role = user?.role || 'GUEST';

  switch (langKey) {
    case 'es':
      if (role === 'ADMIN') {
        return `¡Hola, ${first || 'Administrador'}! 🦅 Soy Haribon — tu asistente de IA de DASIG.\n\nComo administrador, puedo asistirte en español sobre métricas del portal, aforos de eventos, cursos de capacitación y gestión de gobernanza.\n\n¿En qué puedo ayudarte hoy?`;
      }
      if (role === 'MEMBER') {
        return `¡Bienvenido de nuevo, ${first || 'Miembro'}! 🦅 Soy Haribon — tu asistente de IA de DASIG.\n\nTienes acceso completo como miembro. Pregúntame sobre próximas conferencias, inscripciones a capacitaciones, becas de investigación DOST o políticas de gobernanza.\n\n¿En qué puedo ayudarte hoy?`;
      }
      return `¡Hola, ${first || 'invitado'}! 🦅 Soy Haribon — el asistente de IA del Consorcio DASIG (Región VII).\n\nPuedo responder a tus dudas sobre eventos regionales, capacitaciones docentes, membresías y becas de investigación.\n\n¿Qué te gustaría consultar hoy?`;

    case 'bis':
      if (role === 'ADMIN') {
        return `Kumusta, ${first || 'Admin'}! 🦅 Ako si Haribon — ang imong katabang sa DASIG AI.\n\nIsip tagdumala, makatabang ko kanimo bahin sa mga sukod sa portal, kapasidad sa kalihokan, mga kurso sa pagbansay, ug pagdumala sa konsorsyum.\n\nUnsay akong ikatabang kanimo karon?`;
      }
      if (role === 'MEMBER') {
        return `Malipayong pagbalik, ${first || 'Miyembro'}! 🦅 Ako si Haribon — ang imong katabang sa DASIG AI.\n\nNaa kay tibuok access isip miyembro. Pangutana kanako bahin sa mga umaabot nga komperensya, pagpalista sa training, mga grant sa DOST, o mga polisiya sa pamunoan.\n\nUnsay akong ikatabang kanimo karon?`;
      }
      return `Kumusta, ${first || 'higala'}! 🦅 Ako si Haribon — ang AI assistant sa DASIG Consortium (Rehiyon VII).\n\nMakatabang ko nimo bahin sa mga events, training, pondo sa DOST, ug membership sa Bisaya.\n\nUnsay gusto nimong masayran karon?`;

    case 'tgl':
      if (role === 'ADMIN') {
        return `Magandang araw, ${first || 'Admin'}! 🦅 Ako si Haribon — ang iyong DASIG AI Assistant.\n\nBilang tagapangasiwa, handa akong tumulong sa mga sukatan ng portal, kapasidad ng events, kurso sa pagsasanay, at pamamahala.\n\nAno po ang maipaglilingkod ko ngayon?`;
      }
      if (role === 'MEMBER') {
        return `Maligayang pagbabalik, ${first || 'Miyembro'}! 🦅 Ako si Haribon — ang iyong DASIG AI Assistant.\n\nMayroon kang buong access bilang miyembro. Magtanong tungkol sa mga paparating na kumperensya, pagpapatala sa training, DOST research grants, o mga patakaran.\n\nPaano kita matutulungan ngayon?`;
      }
      return `Magandang araw, ${first || 'kaibigan'}! 🦅 Ako si Haribon — ang AI assistant ng DASIG Consortium (Rehiyon VII).\n\nHanda akong sumagot sa wikang Filipino tungkol sa events, training, at research grants.\n\nAno po ang nais mong malaman?`;

    case 'ja':
      return `おかえりなさい、${first || 'メンバー'}さん！🦅 私はDASIG AIアシスタントのHaribonです。\n\n第7地域の今後のカンファレンス、教員研修プログラム、DOST研究助成金、ガバナンス方針について日本語でお答えします。\n\n本日はどのようなご用件でしょうか？`;

    case 'zh':
      return `欢迎回来，${first || '会员'}！🦅 我是Haribon——您的DASIG智能助手。\n\n您可以向我咨询关于第7地区学术峰会、教师专业培训报名、DOST科研资助及联盟政策。\n\n今天有什么我可以协助您的吗？`;

    case 'ko':
      return `다시 오신 것을 환영합니다, ${first || '회원'}님! 🦅 저는 DASIG AI 어시스턴트 Haribon입니다.\n\nRegion VII 학술 컨퍼런스, 교수진 교육 프로그램, DOST 연구 지원금 및 거버넌스 정책에 대해 언제든 문의하세요.\n\n오늘 어떤 도움이 필요하신가요?`;

    case 'fr':
      return `Bienvenue à nouveau, ${first || 'Membre'} ! 🦅 Je suis Haribon — votre assistant IA DASIG.\n\nPosez-moi vos questions sur les conférences régionales, formations, subventions de recherche DOST et politiques académiques.\n\nComment puis-je vous aider aujourd'hui ?`;

    case 'de':
      return `Willkommen zurück, ${first || 'Mitglied'}! 🦅 Ich bin Haribon — Ihr DASIG KI-Assistent.\n\nFragen Sie mich nach anstehenden Region VII Konferenzen, Schulungsprogrammen, DOST-Forschungsstipendien oder Richtlinien.\n\nWie kann ich Ihnen heute helfen?`;

    default: // 'en'
      if (role === 'ADMIN') {
        return `Hello, ${first || 'Admin'}! 🦅 I'm Haribon — your DASIG AI Assistant.\n\nAs an administrator, I can assist you with portal metrics, event capacities, training courses, and governance management.\n\nHow can I help you today?`;
      }
      if (role === 'MEMBER') {
        return `Welcome back, ${first || 'Member'}! 🦅 I'm Haribon — your DASIG AI Assistant.\n\nYou have full member access. Ask me in English, Bisaya, or any language about upcoming conferences, training enrollments, DOST grants, or governance policies.\n\nHow can I help you today?`;
      }
      return `Hi, ${first || 'Guest'}! 🦅 I'm Haribon — the DASIG AI Assistant.\n\nAsk me anything about events, faculty training, membership, research grants, and governance policies. How can I help you today?`;
  }
}

export function getLocalizedUI(langKey = 'en', userName = '') {
  const first = userName ? userName.split(' ')[0] : '';
  const map = {
    en: {
      placeholder: first ? `Ask Haribon (or type /), ${first}...` : 'Ask Haribon anything (or type /)...',
      copy: '📋 Copy',
      copied: '✓ Copied',
      reset: '↺ Reset',
      full: 'Full ↗',
      language: 'Language',
      allLanguages: 'All Languages',
      translate: '🌐 Translate',
      original: '↩ Original',
      translatedTo: 'Translated to',
      showOriginal: 'Show original',
      stopVoice: '⏹ Stop Voice',
      readAloud: '🔊 Read Aloud',
      helpful: 'Helpful',
      notHelpful: 'Not helpful',
    },
    es: {
      placeholder: first ? `Pregunta a Haribon (o escribe /), ${first}...` : 'Pregunta a Haribon cualquier duda (o escribe /)...',
      copy: '📋 Copiar',
      copied: '✓ Copiado',
      reset: '↺ Reiniciar',
      full: 'Completo ↗',
      language: 'Idioma',
      allLanguages: 'Todos los idiomas',
      translate: '🌐 Traducir',
      original: '↩ Original',
      translatedTo: 'Traducido al',
      showOriginal: 'Ver original',
      stopVoice: '⏹ Detener',
      readAloud: '🔊 Escuchar voz',
      helpful: 'Útil',
      notHelpful: 'No útil',
    },
    bis: {
      placeholder: first ? `Pangutana kang Haribon (o i-type ang /), ${first}...` : 'Pangutana kang Haribon bisan unsa (o i-type ang /)...',
      copy: '📋 Kopyaha',
      copied: '✓ Nakopya',
      reset: '↺ I-reset',
      full: 'Tibuok ↗',
      language: 'Pinulongan',
      allLanguages: 'Tanan nga Pinulongan',
      translate: '🌐 Hubara',
      original: '↩ Orihinal',
      translatedTo: 'Gihubad sa',
      showOriginal: 'Ipakita ang orihinal',
      stopVoice: '⏹ Hunonga',
      readAloud: '🔊 Paminawa',
      helpful: 'Makatabang',
      notHelpful: 'Dili makatabang',
    },
    tgl: {
      placeholder: first ? `Magtanong kay Haribon (o i-type ang /), ${first}...` : 'Magtanong kay Haribon (o i-type ang /)...',
      copy: '📋 Kopyahin',
      copied: '✓ Nakopya',
      reset: '↺ I-reset',
      full: 'Buong Screen ↗',
      language: 'Wika',
      allLanguages: 'Lahat ng Wika',
      translate: '🌐 Isalin',
      original: '↩ Orihinal',
      translatedTo: 'Isinalin sa',
      showOriginal: 'Ipakita ang orihinal',
      stopVoice: '⏹ Ihinto',
      readAloud: '🔊 Pakinggan',
      helpful: 'Nakatulong',
      notHelpful: 'Hindi nakatulong',
    },
    ja: {
      placeholder: first ? `Haribonに質問（/ を入力）、${first}さん...` : 'Haribonに何でも質問してください（/ を入力）...',
      copy: '📋 コピー',
      copied: '✓ コピー完了',
      reset: '↺ リセット',
      full: '全画面 ↗',
      language: '言語',
      allLanguages: 'すべての言語',
      translate: '🌐 翻訳',
      original: '↩ 原文',
      translatedTo: '翻訳済み：',
      showOriginal: '原文を表示',
      stopVoice: '⏹ 停止',
      readAloud: '🔊 音声読み上げ',
      helpful: '役に立った',
      notHelpful: '役に立たなかった',
    },
    zh: {
      placeholder: first ? `向Haribon提问（或输入 /），${first}...` : '向Haribon提问任何问题（或输入 /）...',
      copy: '📋 复制',
      copied: '✓ 已复制',
      reset: '↺ 重置',
      full: '全屏 ↗',
      language: '语言',
      allLanguages: '所有语言',
      translate: '🌐 翻译',
      original: '↩ 原文',
      translatedTo: '已翻译为',
      showOriginal: '查看原文',
      stopVoice: '⏹ 停止播放',
      readAloud: '🔊 朗读回答',
      helpful: '有帮助',
      notHelpful: '无帮助',
    },
    ko: {
      placeholder: first ? `Haribon에 질문 (/ 입력), ${first}님...` : 'Haribon에 질문하세요 (/ 입력)...',
      copy: '📋 복사',
      copied: '✓ 복사됨',
      reset: '↺ 초기화',
      full: '전체화면 ↗',
      language: '언어',
      allLanguages: '모든 언어',
      translate: '🌐 번역',
      original: '↩ 원문',
      translatedTo: '번역됨:',
      showOriginal: '원문 보기',
      stopVoice: '⏹ 음성 중지',
      readAloud: '🔊 음성 읽기',
      helpful: '도움됨',
      notHelpful: '도움안됨',
    },
    fr: {
      placeholder: first ? `Demandez à Haribon (ou tapez /), ${first}...` : 'Posez une question à Haribon (ou tapez /)...',
      copy: '📋 Copier',
      copied: '✓ Copié',
      reset: '↺ Réinitialiser',
      full: 'Plein écran ↗',
      language: 'Langue',
      allLanguages: 'Toutes les langues',
      translate: '🌐 Traduire',
      original: '↩ Original',
      translatedTo: 'Traduit en',
      showOriginal: 'Voir original',
      stopVoice: '⏹ Arrêter voix',
      readAloud: '🔊 Écouter',
      helpful: 'Utile',
      notHelpful: 'Pas utile',
    },
    de: {
      placeholder: first ? `Haribon fragen (oder / eingeben), ${first}...` : 'Haribon fragen (oder / eingeben)...',
      copy: '📋 Kopieren',
      copied: '✓ Kopiert',
      reset: '↺ Zurücksetzen',
      full: 'Vollbild ↗',
      language: 'Sprache',
      allLanguages: 'Alle Sprachen',
      translate: '🌐 Übersetzen',
      original: '↩ Original',
      translatedTo: 'Übersetzt ins',
      showOriginal: 'Original anzeigen',
      stopVoice: '⏹ Stoppen',
      readAloud: '🔊 Vorlesen',
      helpful: 'Hilfreich',
      notHelpful: 'Nicht hilfreich',
    },
  };
  return map[langKey] || map.en;
}

export const LANG_CHIPS = {
  en: [
    { label: '📅 Upcoming Summits', q: 'What events are coming up in Region VII?' },
    { label: '🎓 Faculty Training', q: 'What training programs are open for enrollment?' },
    { label: '💰 DOST-7 Research Grants', q: 'What research funding opportunities are available?' },
    { label: '🏛 Consortium Members', q: 'Who are the DASIG member universities and agencies?' },
    { label: '📋 Governance Charters', q: 'What policies and IP accords are active?' },
  ],
  bis: [
    { label: '📅 Mga Kalihokan (Events)', q: 'Maayong adlaw! Unsay mga umaabot nga events ug summits sa DASIG?' },
    { label: '🎓 Libreng Bootcamps', q: 'Unsa ang mga available nga training programs para sa faculty?' },
    { label: '💰 DOST Panukiduki', q: 'Naa bay available nga research grants gikan sa DOST-7?' },
    { label: '🏛 Kasaping Unibersidad', q: 'Kinsa ang mga miyembro nga unibersidad sa Central Visayas?' },
    { label: '🤝 Unsaon Pag-apil', q: 'Unsaon pag-apil o pag-apply sa membership sa konsorsyum?' },
  ],
  tgl: [
    { label: '📅 Paparating na Kaganapan', q: 'Magandang araw! May mga paparating bang event o summit sa DASIG?' },
    { label: '🎓 Pagsasanay ng Guro', q: 'Ano-anong training bootcamps ang bukas para salihan?' },
    { label: '💰 DOST Research Grants', q: 'Mayroon bang open research funding para sa unibersidad?' },
    { label: '🏛 Kasaping Institusyon', q: 'Sino-sino ang mga miyembro ng DASIG consortium?' },
    { label: '📋 Patakaran at Privacy', q: 'Ano ang mga patakaran sa Data Privacy ng DASIG?' },
  ],
  es: [
    { label: '📅 Eventos de la Región VII', q: '¿Cuáles son los próximos eventos del consorcio?' },
    { label: '🎓 Capacitación Docente', q: '¿Qué programas de formación están disponibles?' },
    { label: '🏛 Miembros del Consorcio', q: '¿Quiénes son las universidades e instituciones de DASIG?' },
    { label: '💰 Becas e Investigación', q: '¿Qué fondos de investigación DOST-7 están abiertos?' },
  ],
  ja: [
    { label: '📅 イベント・サミット', q: '第7地域で予定されているイベントを教えてください。' },
    { label: '🎓 教員研修プログラム', q: '受講可能なトレーニングプログラムは何ですか？' },
    { label: '🏛 加盟大学・機関', q: 'DASIGコンソーシアムの加盟メンバーは誰ですか？' },
    { label: '💰 研究助成金', q: '利用可能なDOST-7研究助成金について教えてください。' },
  ],
  zh: [
    { label: '📅 近期活动与峰会', q: 'DASIG近期有哪些开放的区域学术活动？' },
    { label: '🎓 教师发展培训', q: '有哪些可报名的专业技能与科研培训？' },
    { label: '🏛 联盟成员院校', q: 'DASIG联盟包含哪些第7地区的大学与政府机构？' },
    { label: '💰 科研资助申请', q: '有哪些可申请的DOST-7科研专项基金？' },
  ],
  ko: [
    { label: '📅 예정된 학술 컨퍼런스', q: 'Region VII의 예정된 이벤트와 서밋은 무엇인가요?' },
    { label: '🎓 교수진 교육 프로그램', q: '현재 신청 가능한 교원 연수 프로그램은 무엇인가요?' },
    { label: '🏛 컨소시엄 회원 기관', q: 'DASIG 컨소시엄에 속한 회원 대학들은 어디인가요?' },
    { label: '💰 DOST-7 연구 지원금', q: '신청 가능한 연구 지원금 기회는 무엇인가요?' },
  ],
  fr: [
    { label: '📅 Sommets et Conférences', q: 'Quels sont les événements à venir dans la région VII ?' },
    { label: '🎓 Formations Enseignants', q: 'Quels programmes de formation sont ouverts aux inscriptions ?' },
    { label: '🏛 Membres du Consortium', q: 'Quelles sont les universités membres de DASIG ?' },
    { label: '💰 Bourses de Recherche DOST', q: 'Quelles opportunités de financement de recherche sont disponibles ?' },
  ],
  de: [
    { label: '📅 Kommende Konferenzen', q: 'Welche Veranstaltungen stehen in Region VII an?' },
    { label: '🎓 Dozenten-Fortbildung', q: 'Welche Schulungsprogramme stehen zur Anmeldung offen?' },
    { label: '🏛 Verbundmitglieder', q: 'Welche Universitäten gehören dem DASIG-Konsortium an?' },
    { label: '💰 DOST-Forschungsstipendien', q: 'Welche Fördermöglichkeiten für Forschung gibt es?' },
  ],
};

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
