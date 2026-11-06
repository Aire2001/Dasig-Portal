import { api } from '../api.js';

export const SUPPORTED_LANGUAGES = [
  { key: 'en',  code: 'en',    bcp47: 'en-US', flag: '🇺🇸', label: 'US English',            name: 'English',              short: 'EN',  tag: 'English' },
  { key: 'bis', code: 'ceb',   ttsCode: 'tl', bcp47: 'fil-PH', flag: '🇵🇭', label: 'PH Bisaya (Cebuano)',   name: 'Bisaya (Cebuano)',     short: 'BIS', tag: 'Cebuano' },
  { key: 'tgl', code: 'tl',    bcp47: 'fil-PH', flag: '🇵🇭', label: 'PH Tagalog (Filipino)',  name: 'Tagalog (Filipino)',    short: 'TAG', tag: 'Filipino' },
  { key: 'es',  code: 'es',    bcp47: 'es-ES', flag: '🇪🇸', label: 'ES Español (Spanish)',   name: 'Español (Spanish)',     short: 'ES',  tag: 'Spanish' },
  { key: 'ja',  code: 'ja',    bcp47: 'ja-JP', flag: '🇯🇵', label: 'JP 日本語 (Japanese)',    name: '日本語 (Japanese)',      short: 'JA',  tag: 'Japanese' },
  { key: 'ko',  code: 'ko',    bcp47: 'ko-KR', flag: '🇰🇷', label: 'KR 한국어 (Korean)',      name: '한국어 (Korean)',        short: 'KO',  tag: 'Korean' },
  { key: 'zh',  code: 'zh-CN', bcp47: 'zh-CN', flag: '🇨🇳', label: 'CN 中文 (Chinese)',       name: '中文 (Chinese)',         short: 'ZH',  tag: 'Chinese' },
  { key: 'fr',  code: 'fr',    bcp47: 'fr-FR', flag: '🇫🇷', label: 'FR Français (French)',    name: 'Français (French)',      short: 'FR',  tag: 'French' },
  { key: 'de',  code: 'de',    bcp47: 'de-DE', flag: '🇩🇪', label: 'DE Deutsch (German)',     name: 'Deutsch (German)',       short: 'DE',  tag: 'German' },
  { key: 'ar',  code: 'ar',    bcp47: 'ar-SA', flag: '🇸🇦', label: 'SA العربية (Arabic)',    name: 'العربية (Arabic)',      short: 'AR',  tag: 'Arabic' },
  { key: 'ilo', code: 'ilo',   ttsCode: 'tl', bcp47: 'fil-PH', flag: '🇵🇭', label: 'PH Ilokano',             name: 'Ilokano',               short: 'ILO', tag: 'Ilokano' },
  { key: 'hil', code: 'hil',   ttsCode: 'tl', bcp47: 'fil-PH', flag: '🇵🇭', label: 'PH Hiligaynon (Ilonggo)',name: 'Hiligaynon (Ilonggo)',  short: 'HIL', tag: 'Hiligaynon' },
  { key: 'it',  code: 'it',    bcp47: 'it-IT', flag: '🇮🇹', label: 'IT Italiano (Italian)',   name: 'Italiano (Italian)',     short: 'IT',  tag: 'Italian' },
  { key: 'id',  code: 'id',    bcp47: 'id-ID', flag: '🇮🇩', label: 'ID Bahasa Indonesia',    name: 'Bahasa Indonesia',      short: 'ID',  tag: 'Indonesian' },
];

export const PRIMARY_LANG_KEYS = ['en', 'bis', 'tgl', 'es', 'ja', 'id'];

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

    case 'id':
      if (role === 'ADMIN') {
        return `Halo, ${first || 'Administrator'}! 🦅 Saya Haribon — Asisten AI DASIG Anda.\n\nSebagai pengelola portal, saya siap membantu Anda menganalisis metrik sistem, kapasitas acara, program pelatihan, dan manajemen tata kelola konsorsium.\n\nAda yang bisa saya bantu hari ini?`;
      }
      if (role === 'MEMBER') {
        return `Selamat datang kembali, ${first || 'Anggota'}! 🦅 Saya Haribon — Asisten AI DASIG Anda.\n\nAnda memiliki akses penuh sebagai anggota. Tanyakan kepada saya tentang konferensi mendatang di Wilayah VII, pendaftaran pelatihan dosen, hibah penelitian DOST, atau kebijakan tata kelola.\n\nAda yang bisa saya bantu hari ini?`;
      }
      return `Halo, ${first || 'Tamu'}! 🦅 Saya Haribon — Asisten AI Konsorsium DASIG (Wilayah VII Central Visayas).\n\nSilakan tanyakan tentang acara regional, pelatihan dosen, keanggotaan institusi, dan hibah penelitian.\n\nApa yang ingin Anda ketahui hari ini?`;

    case 'ja':
      if (role === 'ADMIN') {
        return `管理者様、お疲れ様です！🦅 私はDASIG AIアシスタントのHaribonです。\n\nポータルメトリクス、イベント定員、教員研修コース、コンソーシアムガバナンスの管理を支援します。\n\nどのようなサポートが必要でしょうか？`;
      }
      return `おかえりなさい、${first || 'メンバー'}さん！🦅 私はDASIG AIアシスタントのHaribonです。\n\n第7地域の今後のカンファレンス、教員研修プログラム、DOST研究助成金、ガバナンス方針について日本語でお答えします。\n\n本日はどのようなご用件でしょうか？`;

    case 'ko':
      if (role === 'ADMIN') {
        return `안녕하세요, ${first || '관리자'}님! 🦅 저는 DASIG AI 어시스턴트 Haribon입니다。\n\n포털 지표, 행사 수용 인원, 교수 연수 과정 및 컨소시엄 거버넌스 관리를 지원해 드립니다。\n\n오늘 어떤 업무를 도와드릴까요?`;
      }
      return `다시 오신 것을 환영합니다, ${first || '회원'}님! 🦅 저는 DASIG AI 어시스턴트 Haribon입니다。\n\nRegion VII 학술 컨퍼런스, 교수진 교육 프로그램, DOST 연구 지원금 및 거버넌스 정책에 대해 언제든 문의하세요。\n\n오늘 어떤 도움이 필요하신가요?`;

    case 'zh':
      if (role === 'ADMIN') {
        return `您好，${first || '管理员'}！🦅 我是Haribon——您的DASIG智能助手。\n\n作为系统管理员，我可以协助您查看门户指标、活动名额容量、培训课程进度以及联盟治理政策。\n\n今天有什么可以帮您的？`;
      }
      return `欢迎回来，${first || '会员'}！🦅 我是Haribon——您的DASIG智能助手。\n\n您可以向我咨询关于第7地区学术峰会、教师专业培训报名、DOST科研资助及联盟政策。\n\n今天有什么我可以协助您的吗？`;

    case 'fr':
      if (role === 'ADMIN') {
        return `Bonjour, ${first || 'Administrateur'} ! 🦅 Je suis Haribon — votre assistant IA DASIG.\n\nEn tant qu'administrateur, je peux vous aider avec les métriques du portail, les jauges d'événements, les formations et la gouvernance.\n\nQue puis-je faire pour vous aujourd'hui ?`;
      }
      return `Bienvenue à nouveau, ${first || 'Membre'} ! 🦅 Je suis Haribon — votre assistant IA DASIG.\n\nPosez-moi vos questions sur les conférences régionales, formations, subventions de recherche DOST et politiques académiques.\n\nComment puis-je vous aider aujourd'hui ?`;

    case 'de':
      if (role === 'ADMIN') {
        return `Hallo, ${first || 'Administrator'}! 🦅 Ich bin Haribon — Ihr DASIG KI-Assistent.\n\nAls Administrator unterstütze ich Sie bei Portal-Metriken, Teilnehmerkapazitäten, Schulungskursen und Governance-Verwaltung.\n\nWas kann ich heute für Sie tun?`;
      }
      return `Willkommen zurück, ${first || 'Mitglied'}! 🦅 Ich bin Haribon — Ihr DASIG KI-Assistent.\n\nFragen Sie mich nach anstehenden Region VII Konferenzen, Schulungsprogrammen, DOST-Forschungsstipendien oder Richtlinien.\n\nWie kann ich Ihnen heute helfen?`;

    case 'ar':
      if (role === 'ADMIN') {
        return `مرحباً، ${first || 'المسؤول'}! 🦅 أنا هاريبون — مساعدك الذكي في DASIG.\n\nبصفتك مسؤولاً، يمكنني مساعدتك في مؤشرات المنصة، وطاقة استيعاب الفعاليات، والدورات التدريبية وإدارة الحوكمة.\n\nكيف يمكنني خدمتك اليوم؟`;
      }
      return `مرحباً بعودتك، ${first || 'العضو'}! 🦅 أنا هاريبون — مساعدك الذكي في اتحاد DASIG.\n\nلديك حق الوصول الكامل كعضو معتمد. يمكنك سؤالي عن المؤتمرات الإقليمية القادمة، والتسجيل في الدورات التدريبية، ومنح الأبحاث DOST، وسياسات الحوكمة.\n\nكيف يمكنني مساعدتك اليوم؟`;

    case 'it':
      if (role === 'ADMIN') {
        return `Ciao, ${first || 'Amministratore'}! 🦅 Sono Haribon — il tuo assistente IA DASIG.\n\nCome amministratore, posso assisterti con le metriche del portale, la capienza degli eventi, i corsi di formazione e la governance.\n\nCome posso esserti utile oggi?`;
      }
      return `Bentornato, ${first || 'Membro'}! 🦅 Sono Haribon — il tuo assistente IA DASIG.\n\nHai accesso completo come membro. Chiedimi informazioni su conferenze imminenti nella Regione VII, iscrizioni ai corsi di formazione, borse di ricerca DOST o politiche di governance.\n\nCome posso aiutarti oggi?`;

    case 'ilo':
      if (role === 'ADMIN') {
        return `Naimbag nga aldaw, ${first || 'Admin'}! 🦅 Siak ni Haribon — ti katulongam iti DASIG AI.\n\nKas administrador, makatulongak kadagiti bilang ti portal, kapasidad ti aktibidad, kurso ti panagsanay, ken panangidaulo ti konsorsium.\n\nAnia ti maitulongko kenka ita?`;
      }
      return `Naimbag a panagsubli, ${first || 'Kameng'}! 🦅 Siak ni Haribon — ti katulongam iti DASIG AI.\n\nAddaan ka iti naan-anay nga access kas kameng. Saludsodem kaniak ti maipapan kadagiti sumaruno a komperensia, panagpalista iti panagsanay, DOST research grants, wenno paglintegan ti konsorsium.\n\nKasanoka a matulongan ita nga aldaw?`;

    case 'hil':
      if (role === 'ADMIN') {
        return `Maayong adlaw, ${first || 'Admin'}! 🦅 Ako si Haribon — ang imo kaupod sa DASIG AI.\n\nBilang tagdumala, makabulig ako sa mga numero sang portal, kapasidad sang mga buluhaton, kurso sa paghanas, kag pagdumala.\n\nAno ang akon mabulig sa imo subong?`;
      }
      return `Maayong pagbalik, ${first || 'Miyembro'}! 🦅 Ako si Haribon — ang imo kaupod sa DASIG AI.\n\nMay bug-os ka nga access bilang miyembro. Pamangkutan ako parte sa mga maabot nga komperensya sa Rehiyon VII, pagpa-enroll sa training, DOST research grants, ukon mga pagsulundan sang konsorsyum.\n\nAno ang akon mabulig sa imo subong?`;

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
    id: {
      placeholder: first ? `Tanyakan pada Haribon (atau ketik /), ${first}...` : 'Tanyakan apa saja kepada Haribon (atau ketik /)...',
      copy: '📋 Salin',
      copied: '✓ Disalin',
      reset: '↺ Reset',
      full: 'Layar Penuh ↗',
      language: 'Bahasa',
      allLanguages: 'Semua Bahasa',
      translate: '🌐 Terjemahkan',
      original: '↩ Asli',
      translatedTo: 'Diterjemahkan ke',
      showOriginal: 'Lihat teks asli',
      stopVoice: '⏹ Hentikan Suara',
      readAloud: '🔊 Dengarkan Suara',
      helpful: 'Membantu',
      notHelpful: 'Kurang membantu',
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
    ar: {
      placeholder: first ? `اسأل هاريبون (أو اكتب /)، ${first}...` : 'اسأل هاريبون أي سؤال (أو اكتب /)...',
      copy: '📋 نسخ',
      copied: '✓ تم النسخ',
      reset: '↺ إعادة ضبط',
      full: 'ملء الشاشة ↗',
      language: 'اللغة',
      allLanguages: 'جميع اللغات',
      translate: '🌐 ترجمة',
      original: '↩ النص الأصلي',
      translatedTo: 'مترجم إلى',
      showOriginal: 'عرض الأصل',
      stopVoice: '⏹ إيقاف الصوت',
      readAloud: '🔊 قراءة صوتية',
      helpful: 'مفيد',
      notHelpful: 'غير مفيد',
    },
    it: {
      placeholder: first ? `Chiedi a Haribon (o digita /), ${first}...` : 'Chiedi a Haribon qualsiasi cosa (o digita /)...',
      copy: '📋 Copia',
      copied: '✓ Copiato',
      reset: '↺ Reimposta',
      full: 'Schermo intero ↗',
      language: 'Lingua',
      allLanguages: 'Tutte le lingue',
      translate: '🌐 Traduci',
      original: '↩ Originale',
      translatedTo: 'Tradotto in',
      showOriginal: 'Mostra originale',
      stopVoice: '⏹ Interrompi',
      readAloud: '🔊 Ascolta',
      helpful: 'Utile',
      notHelpful: 'Non utile',
    },
    ilo: {
      placeholder: first ? `Saludsodem ken ni Haribon (wenno i-type /), ${first}...` : 'Saludsodem ken ni Haribon (wenno i-type /)...',
      copy: '📋 Kopiaem',
      copied: '✓ Nakopian',
      reset: '↺ I-reset',
      full: 'Pno a Screen ↗',
      language: 'Pagsasao',
      allLanguages: 'Amin a Pagsasao',
      translate: '🌐 Ipatarus',
      original: '↩ Kasisigud',
      translatedTo: 'Naipatarus iti',
      showOriginal: 'Ipakita ti kasisigud',
      stopVoice: '⏹ Isardeng',
      readAloud: '🔊 Denggen',
      helpful: 'Makatulong',
      notHelpful: 'Saan a makatulong',
    },
    hil: {
      placeholder: first ? `Pamangkuta si Haribon (ukon i-type ang /), ${first}...` : 'Pamangkuta si Haribon sang bisan ano (ukon i-type ang /)...',
      copy: '📋 Kopyaha',
      copied: '✓ Nakopya',
      reset: '↺ I-reset',
      full: 'Tibuok Screen ↗',
      language: 'Hambal',
      allLanguages: 'Tanan nga Hambal',
      translate: '🌐 Badbasa',
      original: '↩ Orihinal',
      translatedTo: 'Ginbadbad sa',
      showOriginal: 'Ipakita ang orihinal',
      stopVoice: '⏹ Untata',
      readAloud: '🔊 Pamatian',
      helpful: 'Makatabang',
      notHelpful: 'Wala nagbulig',
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
  id: [
    { label: '📅 Agenda Acara Region VII', q: 'Apa saja acara dan konferensi mendatang di Wilayah VII?' },
    { label: '🎓 Pelatihan Dosen & Tenaga Pendidik', q: 'Program pelatihan apa saja yang sedang dibuka untuk pendaftaran?' },
    { label: '🏛 Universitas Anggota Konsorsium', q: 'Siapa saja institusi dan universitas anggota DASIG?' },
    { label: '💰 Hibah Riset DOST-7', q: 'Peluang pendanaan riset apa saja yang tersedia untuk akademisi?' },
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
  ar: [
    { label: '📅 المؤتمرات القادمة', q: 'ما هي المؤتمرات والفعاليات القادمة في المنطقة السابعة؟' },
    { label: '🎓 تدريب أعضاء التدريس', q: 'ما هي برامج تدريب وتطوير أعضاء هيئة التدريس المتاحة؟' },
    { label: '🏛 الجامعات الأعضاء', q: 'من هي الجامعات والمؤسسات الأعضاء في اتحاد DASIG؟' },
    { label: '💰 منح أبحاث DOST', q: 'ما هي فرص التمويل ومنح الأبحاث المفتوحة حالياً؟' },
  ],
  it: [
    { label: '📅 Prossimi Vertici', q: 'Quali eventi sono in programma nella Regione VII?' },
    { label: '🎓 Formazione Docenti', q: 'Quali programmi di formazione sono aperti alle iscrizioni?' },
    { label: '🏛 Membri del Consorzio', q: 'Quali sono le università e istituzioni partner di DASIG?' },
    { label: '💰 Borse di Ricerca DOST', q: 'Quali opportunità di finanziamento della ricerca sono attive?' },
  ],
  ilo: [
    { label: '📅 Sumaruno nga Pasamak', q: 'Ania dagiti sumaruno nga aktibidad ken kumperensia iti Rehion VII?' },
    { label: '🎓 Panagsanay dagiti Manursuro', q: 'Ania dagiti silulukat a kurso ti panagsanay para iti mannursuro?' },
    { label: '🏛 Kameng nga Unibersidad', q: 'Siasino dagiti kameng nga unibersidad iti Central Visayas?' },
    { label: '💰 DOST Research Grants', q: 'Kasanomi ti makaala ti tulong-pinansial iti panagsukimat manipud DOST?' },
  ],
  hil: [
    { label: '📅 Mga Maabot nga Kahiwatan', q: 'Ano ang mga maabot nga mga summit kag kumperensya sa Rehiyon VII?' },
    { label: '🎓 Paghanas sang Manunudlo', q: 'Ano ang mga training programs nga pwede salid-an sang mga manunudlo?' },
    { label: '🏛 Miyembro nga Unibersidad', q: 'Sin-o ang mga miyembro nga unibersidad sang DASIG?' },
    { label: '💰 DOST Pondo sa Panukiduki', q: 'Ano ang mga pondo kag grants para sa panukiduki sang DOST-7?' },
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
  } catch {
    // Client direct network blocked by ad-blocker or CORS, fallback to API proxy
  }

  // 2. Try Backend API Translation Proxy
  try {
    const res = await api.chatbot.translate(text, targetCode);
    if (res && res.translatedText) {
      clientTranslationCache.set(cacheKey, res.translatedText);
      return res.translatedText;
    }
  } catch {
    // API proxy fallback
  }

  return text;
}
