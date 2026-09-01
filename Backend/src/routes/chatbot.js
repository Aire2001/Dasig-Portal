const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

// Helper: Detect language (English, Bisaya/Cebuano, or Tagalog/Filipino)
function detectLanguage(text) {
  if (!text) return 'english';
  const t = text.toLowerCase();

  // Strong Bisaya / Cebuano indicators
  const bisayaMarkers = [
    'unsa', 'unsaon', 'kinsa', 'kinsay', 'kanus-a', 'kanus a', 'asa', 'diin', 'ngano', 'nganong',
    'naa', 'naay', 'wala', 'walay', 'pila', 'tagpila', 'palihug', 'palihog', 'maayo', 'maayong',
    'buntag', 'hapon', 'gabii', 'udto', 'adlaw', 'apil', 'moapil', 'pag-apil', 'pagsalmot', 'miyembro',
    'tabang', 'tabangi', 'kahibalo', 'paminaw', 'tudlo', 'tudloi', 'kuha', 'bayad', 'libre', 'kauban',
    'buhaton', 'gasto', 'kwarta', 'balita', 'kasulatan', 'eskwelahan', 'unibersidad', 'salamat',
    'daghang salamat', 'kaayo', 'diay', 'bitaw', 'gud', 'man', 'gani', 'sab', 'pud', 'karon', 'unya',
    'ganahan', 'gusto ko', 'pwede ba', 'mahimo', 'kinahanglan', 'asa dapit', 'kinsay pwede', 'unsay',
    'unsa man', 'unsa diay', 'ayaw', 'ambot', 'tinuod', 'tinuod ba', 'pila bayad', 'libre ba', 'sulod',
    'panukiduki', 'eskwela', 'makatabang', 'pasabot'
  ];

  // Strong Tagalog / Filipino indicators
  const tagalogMarkers = [
    'ano', 'paano', 'sino', 'sino-sino', 'kailan', 'saan', 'nasaan', 'bakit', 'meron', 'mayroon',
    'wala', 'walang', 'magkano', 'paki', 'magandang', 'umaga', 'hapon', 'gabi', 'tanghali', 'araw',
    'sumali', 'pagsali', 'kasali', 'miyembro', 'tulong', 'tulungan', 'alam', 'turuan', 'kunin', 'bayad',
    'libre', 'kasama', 'gawin', 'gastos', 'pera', 'balita', 'dokumento', 'paaralan', 'unibersidad',
    'salamat', 'maraming salamat', 'po', 'opo', 'naman', 'kasi', 'talaga', 'pala', 'ngayon', 'mamaya',
    'nais', 'gusto ko', 'pwede ba', 'puwede', 'maaari', 'kailangan', 'saan banda', 'sino ang', 'ano ang',
    'ano ba', 'huwag', 'ewan', 'totoo ba', 'magkano bayad', 'libre ba', 'paano ba', 'pasok',
    'pananaliksik', 'paaralan', 'makakatulong', 'ibig sabihin'
  ];

  let bScore = 0;
  let tScore = 0;

  const words = t.split(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ-]+/).filter(Boolean);
  for (const w of words) {
    if (bisayaMarkers.includes(w)) bScore += 1.5;
    if (tagalogMarkers.includes(w)) tScore += 1.5;
  }

  // Regex multi-word boosts
  if (/\b(unsa(ng|on|y)?|kinsa(y)?|kanus-?a|maayong (buntag|hapon|gabii|adlaw)|daghang salamat|naa(y)?|walay|tabangi ko)\b/i.test(t)) {
    bScore += 4;
  }
  if (/\b(paano|ano (ang|ba)|sino (ang|ba)|kailan|magandang (umaga|hapon|gabi|araw)|maraming salamat|meron bang|mayroon bang|po|opo|tulungan mo ako)\b/i.test(t)) {
    tScore += 4;
  }

  if (bScore > tScore && bScore >= 1.5) return 'bisaya';
  if (tScore > bScore && tScore >= 1.5) return 'tagalog';
  return 'english';
}

// Comprehensive Tri-Lingual Knowledge Base
const KB = [
  {
    intent: 'greeting',
    keywords: [
      'hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'hey', 'howdy', 'greetings',
      'maayong buntag', 'maayong hapon', 'maayong gabii', 'maayong adlaw', 'kumusta', 'kamusta', 'musta', 'halo', 'hoy', 'maayo',
      'magandang umaga', 'magandang hapon', 'magandang gabi', 'magandang araw', 'kumusta po', 'kamusta po', 'musta po'
    ],
    reply_en: 'Hello! I am **Haribon AI** 🦅, your intelligent assistant for the DASIG Consortium (Region VII). I can help you with events, training programs, membership applications, research grants, governance policies, and academic inquiries in English, Bisaya, or Tagalog. What can I do for you today?',
    reply_ceb: 'Maayong adlaw! Ako si **Haribon AI** 🦅, ang imong virtual assistant alang sa DASIG Consortium (Rehiyon VII). Makatabang ko kanimo bahin sa mga events, faculty training, membership, research grants, polisiya, ug uban pa sa English, Bisaya, o Tagalog. Unsay akong ikatabang kanimo karon?',
    reply_tgl: 'Magandang araw! Ako si **Haribon AI** 🦅, ang iyong virtual assistant para sa DASIG Consortium (Rehiyon VII). Handa akong tumulong tungkol sa mga events, faculty training, membership, research grants, patakaran, at iba pa sa wikang English, Bisaya, o Tagalog. Ano po ang maipaglilingkod ko?',
  },
  {
    intent: 'thanks',
    keywords: [
      'thank you', 'thanks', 'thank you very much', 'many thanks', 'appreciate it', 'thx', 'ty',
      'salamat', 'daghang salamat', 'salamat kaayo', 'daghan salamat', 'sige salamat', 'salamat sa tabang', 'salamat kaau',
      'maraming salamat', 'maraming salamat po', 'salamat po', 'salamat nang marami', 'sige salamat po'
    ],
    reply_en: "You're very welcome! Feel free to ask if you need anything else regarding DASIG events, training, funding, or research. Have a productive day! 🚀",
    reply_ceb: "Walay sapayan! Ayaw pagduha-duha og pangutana kon duna pa kay mga kinahanglanon bahin sa DASIG events, training, pondo, o research. Maayong adlaw! 🚀",
    reply_tgl: "Walang anuman po! Huwag mag-atubiling magtanong muli kung mayroon ka pang kailangan tungkol sa DASIG events, training, pondo, o pananaliksik. Magandang araw! 🚀",
  },
  {
    intent: 'about_dasig',
    keywords: [
      'what is dasig', 'about dasig', 'dasig consortium', 'who is dasig', 'what does dasig do', 'dasig mission', 'dasig vision',
      'unsa ang dasig', 'unsa man ang dasig', 'mahitungod sa dasig', 'unsay dasig', 'unsa ning dasig', 'unsay buhaton sa dasig', 'misyon sa dasig', 'bisyon sa dasig',
      'ano ang dasig', 'tungkol sa dasig', 'ano po ang dasig', 'ano ang ginagawa ng dasig', 'ano ang misyon ng dasig', 'ano ang layunin ng dasig'
    ],
    reply_en: '🏛️ **About DASIG:**\nDASIG (Dynamic Academic and Scientific Information Group) is a premier Region VII academic consortium in Central Visayas dedicated to collaborative research, governance innovation, inter-HEI knowledge sharing, and technological capability development.',
    reply_ceb: '🏛️ **Mahitungod sa DASIG:**\nAng DASIG (Dynamic Academic and Scientific Information Group) usa ka konsorsyum sa Rehiyon VII nga naghiusa sa mga unibersidad ug mga ahensya sa gobyerno sa Central Visayas aron magtinabangay sa panukiduki (research), inobasyon sa pamunoan, ug pagpalambo sa teknolohiya.',
    reply_tgl: '🏛️ **Tungkol sa DASIG:**\nAng DASIG (Dynamic Academic and Scientific Information Group) ay isang konsorsyum sa Rehiyon VII na nag-uugnay sa mga unibersidad at ahensya ng pamahalaan sa Central Visayas para sa collaborative research, inobasyon sa pamamahala, at pagpapalawak ng teknolohiya.',
  },
  {
    intent: 'member_institutions',
    keywords: [
      'member institutions', 'consortium members', 'who are members', 'list of members', 'partner institutions', 'all members',
      'kinsay mga miyembro', 'mga unibersidad nga miyembro', 'kinsay apil sa dasig', 'listahan sa mga miyembro', 'kinsay mga sakop',
      'sino-sino ang mga miyembro', 'mga kasaping paaralan', 'sino ang kasali sa dasig', 'talaan ng mga miyembro'
    ],
    reply_en: '🏛️ **DASIG Consortium Member Institutions:**\n• **CIT-University** (Cebu City — Host & Engineering Hub)\n• **UP Visayas** (Marine & Aquatic Sciences, Iloilo/Miagao)\n• **University of San Agustin** (Governance & Ethics, Iloilo)\n• **DOST Region VII** (Science, Technology & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Trade & MSME Commercialization)\n• **DepEd Region VII** (Basic Education & EdTech)',
    reply_ceb: '🏛️ **Mga Miyembro sa DASIG Consortium:**\n• **CIT-University** (Cebu City — Host & Engineering Hub)\n• **UP Visayas** (Marine & Aquatic Sciences, Iloilo/Miagao)\n• **University of San Agustin** (Governance & Ethics, Iloilo)\n• **DOST Region VII** (Siyensya, Teknolohiya & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Patigayon & MSME Commercialization)\n• **DepEd Region VII** (Edukasyon & EdTech)',
    reply_tgl: '🏛️ **Mga Miyembro ng DASIG Consortium:**\n• **CIT-University** (Cebu City — Host & Engineering Hub)\n• **UP Visayas** (Marine & Aquatic Sciences, Iloilo/Miagao)\n• **University of San Agustin** (Governance & Ethics, Iloilo)\n• **DOST Region VII** (Agham, Teknolohiya & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Kalakalan & MSME Commercialization)\n• **DepEd Region VII** (Edukasyon & EdTech)',
  },
  {
    intent: 'events',
    keywords: [
      'event', 'events', 'summit', 'conference', 'seminar', 'workshop', 'calendar schedule', 'upcoming events',
      'unsay mga event', 'unsay kalihokan', 'naay event', 'mga umaabot nga event', 'kanus-a ang summit', 'unsay seminar', 'mga kalihukan',
      'anong mga event', 'anong kaganapan', 'may event ba', 'mga paparating na kaganapan', 'kailan ang summit', 'anong seminar', 'mga pagtitipon'
    ],
    reply_en: '📅 **Consortium Events & Summits:**\nDASIG organizes annual research symposiums, innovation summits, and faculty workshops across Central Visayas member institutions. You can view full details and register in the Programs module.',
    reply_ceb: '📅 **Mga Kalihokan ug Summit sa Konsorsyum:**\nAng DASIG nagpahigayon og tinuig nga research symposiums, innovation summits, ug workshops sa Rehiyon VII. Mahimo nimong tan-awon ang eskedyul ug magparehistro sa Programs module.',
    reply_tgl: '📅 **Mga Kaganapan at Summit ng Konsorsyum:**\nRegular na nagdaraos ang DASIG ng taunang research symposiums, innovation summits, at workshops sa Rehiyon VII. Maaari mong tingnan ang iskedyul at magparehistro sa Programs module.',
  },
  {
    intent: 'event_register',
    keywords: [
      'register event', 'sign up event', 'join event', 'attend event', 'how to register', 'event registration',
      'unsaon pag-apil sa event', 'unsaon pag-rehistro', 'gusto ko moapil sa event', 'unsaon pagsalmot', 'pwede ba moapil',
      'paano magparehistro sa event', 'paano sumali sa event', 'gusto kong sumali sa event', 'paano mag-register', 'puwede ba sumali'
    ],
    reply_en: '📝 **How to Register for an Event:**\n1. Sign in to your DASIG account.\n2. Navigate to **Programs > Events**.\n3. Choose your desired event and click **"Register"**.\n4. Complete the attendee details and submit. Real-time slot availability is tracked automatically!',
    reply_ceb: '📝 **Unsaon Pag-rehistro sa Event:**\n1. Pag-log in sa imong DASIG account.\n2. Adto sa **Programs > Events**.\n3. Pilia ang event nga gusto nimong apilan ug i-click ang **"Register"**.\n4. Isulod ang imong detalye ug i-submit. Limitado ang mga slots, busa pagparehistro og sayo!',
    reply_tgl: '📝 **Paano Magparehistro sa Event:**\n1. Mag-log in sa iyong DASIG account.\n2. Pumunta sa **Programs > Events**.\n3. Piliin ang nais mong salihang event at i-click ang **"Register"**.\n4. Punan ang iyong mga detalye at i-submit. Limitado ang mga puwesto kaya magparehistro nang maaga!',
  },
  {
    intent: 'training',
    keywords: [
      'training', 'training programs', 'courses', 'bootcamp', 'upskill', 'capacity building',
      'unsay mga training', 'mga kurso', 'training para sa teachers', 'training para sa faculty', 'naay bootcamp', 'unsaon pag-enroll sa training',
      'anong mga training', 'mga kurso', 'pagsasanay para sa mga guro', 'pagsasanay sa faculty', 'may bootcamp ba', 'paano mag-enroll sa training'
    ],
    reply_en: '🎓 **Faculty Development & Technical Bootcamps:**\nDASIG offers specialized training courses in AI Engineering, Full-Stack Web Development, STEM Research Methods, and Public Governance with partner agencies (DICT, DOST, DTI, DepEd).',
    reply_ceb: '🎓 **Mga Training ug Kurso sa DASIG:**\nNagtanyag ang DASIG og mga training sa AI Engineering, Web Development, STEM Research Methods, ug Public Governance kauban ang DICT, DOST, DTI, ug DepEd.',
    reply_tgl: '🎓 **Mga Pagsasanay at Kurso sa DASIG:**\nNag-aalok ang DASIG ng mga pagsasanay sa AI Engineering, Web Development, STEM Research Methods, at Public Governance kasama ang DICT, DOST, DTI, at DepEd.',
  },
  {
    intent: 'funding',
    keywords: [
      'funding', 'grants', 'scholarships', 'research grants', 'dost funding', 'budget', 'financial support',
      'naay funding', 'naay grants', 'kwarta para sa research', 'pondo sa research', 'scholarship', 'tabang pinansyal',
      'may funding ba', 'may grants ba', 'pondo para sa research', 'pondo sa pananaliksik', 'scholarship', 'tulong pinansyal'
    ],
    reply_en: '💰 **Research Grants & Funding Opportunities:**\nDASIG tracks active grant calls from DOST Region VII, international research funds, and institutional consortium grants. Filter by status (Open/Closed) and budget in the **Funding** module.',
    reply_ceb: '💰 **Mga Pondo ug Grants sa Panukiduki (Funding):**\nAng DASIG naglista og mga bukas nga research grants gikan sa DOST, internasyonal nga mga pondo, ug pondo sa konsorsyum. Tan-awa ang mga kwalipikasyon sa **Funding** module.',
    reply_tgl: '💰 **Mga Pondo at Grants sa Pananaliksik (Funding):**\nNaglilista ang DASIG ng mga bukas na research grants mula sa DOST, pandaigdigang pondo, at pondo ng konsorsyum. Tingnan ang mga detalye sa **Funding** module.',
  },
  {
    intent: 'membership',
    keywords: [
      'membership', 'become member', 'apply member', 'join dasig', 'membership application', 'how to join',
      'unsaon pag-apil sa dasig', 'unsaon pagkahimong miyembro', 'gusto ko mahimong member', 'pagsali sa dasig', 'pila bayad sa membership',
      'paano sumali sa dasig', 'paano maging miyembro', 'gusto kong maging member', 'pagsali sa dasig', 'magkano ang membership'
    ],
    reply_en: '👥 **How to Join the DASIG Consortium:**\n1. Sign in to your account.\n2. Go to the **Membership** module and click **"Apply for Membership"**.\n3. Fill in your institutional affiliation, select Tier 1 (Full) or Tier 2 (Associate), and submit for admin approval.',
    reply_ceb: '👥 **Unsaon Pag-apil sa DASIG:**\n1. Pag-log in sa imong account.\n2. Adto sa **Membership** module ug i-click ang **"Apply for Membership"**.\n3. Isulod ang detalye sa imong unibersidad o ahensya, pilia ang Tier 1 o Tier 2, ug i-submit para sa pag-apruba sa admin.',
    reply_tgl: '👥 **Paano Sumali sa DASIG:**\n1. Mag-log in sa iyong account.\n2. Pumunta sa **Membership** module at i-click ang **"Apply for Membership"**.\n3. Punan ang mga detalye ng iyong institusyon, piliin ang Tier 1 o Tier 2, at i-submit para sa pag-apruba ng admin.',
  },
  {
    intent: 'haribon',
    keywords: [
      'haribon', 'who are you', 'what are you', 'ai assistant', 'chatbot', 'dasig ai', 'gemini', 'chatgpt',
      'kinsa ka', 'unsa ka', 'unsa imong ngalan', 'unsa imong mahimo',
      'sino ka', 'ano ka', 'ano ang pangalan mo', 'ano ang kaya mong gawin'
    ],
    reply_en: '🦅 **I am Haribon AI:**\nI am the intelligent virtual assistant and conversational AI for the DASIG Regional Academic Consortium. Inspired by modern Generative AI (ChatGPT & Gemini), I converse in **English**, **Bisaya (Cebuano)**, and **Tagalog (Filipino)** with real-time consortium database integration!',
    reply_ceb: '🦅 **Ako si Haribon AI:**\nAko ang virtual assistant ug conversational AI sa DASIG Regional Academic Consortium. Sama sa ChatGPT ug Gemini, makasabot ug makatubag ko sa **English**, **Bisaya (Cebuano)**, ug **Tagalog (Filipino)** uban sa real-time nga database sa konsorsyum!',
    reply_tgl: '🦅 **Ako si Haribon AI:**\nAko ang virtual assistant at conversational AI ng DASIG Regional Academic Consortium. Tulad ng ChatGPT at Gemini, nakauunawa at nakasasagot ako sa **English**, **Bisaya (Cebuano)**, at **Tagalog (Filipino)** kasama ang real-time database ng konsorsyum!',
  },
  {
    intent: 'general_help',
    keywords: [
      'help', 'tulong', 'tabang', 'unsaon', 'paano', 'what can you do', 'guide', 'assist me',
      'tabangi ko', 'tulungan mo ako', 'unsay mahimo nimo', 'ano ang magagawa mo'
    ],
    reply_en: '💡 **How I Can Assist You:**\n• 📅 **Events & Summits:** Check schedules, venues, and registration.\n• 🎓 **Faculty Training:** Discover courses and get certified.\n• 💰 **Research Grants:** Explore DOST funding calls.\n• 📋 **Governance Policies:** View consortium charters and IP ethics.\n• 🌐 **Trilingual Chat:** Ask me anything in English, Bisaya, or Tagalog!',
    reply_ceb: '💡 **Giunsa Ko Makatabang Kanimo:**\n• 📅 **Mga Kalihokan & Summit:** Tan-awa ang mga iskedyul ug magparehistro.\n• 🎓 **Faculty Training:** Pag-apil sa mga kurso ug pagkuha og sertipiko.\n• 💰 **Research Grants:** Pangita og pondo gikan sa DOST.\n• 📋 **Mga Polisiya:** Basaha ang mga lagda sa konsorsyum ug IP ethics.\n• 🌐 **Trilingual Chat:** Pangutana sa English, Bisaya, o Tagalog!',
    reply_tgl: '💡 **Paano Kita Matutulungan:**\n• 📅 **Mga Kaganapan & Summit:** Alamin ang iskedyul at magparehistro.\n• 🎓 **Faculty Training:** Sumali sa mga kurso at kumuha ng sertipiko.\n• 💰 **Research Grants:** Maghanap ng pondo mula sa DOST.\n• 📋 **Mga Patakaran:** Basahin ang mga charter ng konsorsyum at IP ethics.\n• 🌐 **Trilingual Chat:** Magtanong sa English, Bisaya, o Tagalog!',
  }
];

// Helper: Month detection map
const MONTH_MAP = {
  january: 'Jan', jan: 'Jan', enero: 'Jan',
  february: 'Feb', feb: 'Feb', pebrero: 'Feb',
  march: 'Mar', mar: 'Mar', marso: 'Mar',
  april: 'Apr', apr: 'Apr', abril: 'Apr',
  may: 'May', mayo: 'May',
  june: 'Jun', jun: 'Jun', hunyo: 'Jun',
  july: 'Jul', jul: 'Jul', hulyo: 'Jul',
  august: 'Aug', aug: 'Aug', agosto: 'Aug',
  september: 'Sep', sep: 'Sep', sept: 'Sep', setyembre: 'Sep',
  october: 'Oct', oct: 'Oct', oktubre: 'Oct',
  november: 'Nov', nov: 'Nov', nobyembre: 'Nov',
  december: 'Dec', dec: 'Dec', disyembre: 'Dec'
};

function detectMonthQuery(text) {
  if (!text) return null;
  const words = text.toLowerCase().split(/[^a-z0-9]+/);
  for (const w of words) {
    if (MONTH_MAP[w]) {
      return { token: w, prefix: MONTH_MAP[w], original: w.charAt(0).toUpperCase() + w.slice(1) };
    }
  }
  return null;
}

// Typo-tolerant Levenshtein distance
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array(n + 1).fill(0).map((_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Match intent with scoring
function matchIntent(normalizedText) {
  const lower = normalizedText.toLowerCase();
  let best = null;
  let highestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (lower === kwLower) {
        score = Math.max(score, 10);
      } else if (lower.startsWith(kwLower + ' ') || lower.endsWith(' ' + kwLower) || lower.includes(' ' + kwLower + ' ')) {
        score = Math.max(score, 6 + (kwLower.length / 10));
      } else if (lower.includes(kwLower)) {
        score = Math.max(score, 4 + (kwLower.length / 12));
      }
    }

    if (score > highestScore) {
      highestScore = score;
      best = entry;
    }
  }

  if (highestScore >= 3.5) {
    return { entry: best, score: highestScore };
  }
  return null;
}

// Multi-language followups
const MULTI_FOLLOWUPS = {
  english: [
    'What events are coming up?',
    'How do I become a DASIG member?',
    'What training programs are available?',
    'Tell me about research grants & funding',
    'Who are the member institutions in Region VII?'
  ],
  bisaya: [
    'Unsay mga umaabot nga events?',
    'Unsaon pag-apil sa DASIG?',
    'Unsay mga training programs?',
    'Unsay mga research grants ug funding?',
    'Kinsay mga miyembro nga unibersidad sa Region VII?'
  ],
  tagalog: [
    'Anong mga events ang paparating?',
    'Paano sumali sa DASIG?',
    'Anong training programs ang meron?',
    'Anong research grants at funding ang bukas?',
    'Sino-sino ang mga kasaping unibersidad sa Region VII?'
  ]
};

// External Generative LLM Caller (Gemini / OpenAI fallback)
async function callGenerativeLLM(userPrompt, lang) {
  if (process.env.GEMINI_API_KEY) {
    try {
      const systemInstruction = `You are Haribon AI, the world-class intelligent conversational assistant for the DASIG Regional Academic Consortium (Region VII Central & Western Visayas). You are completely fluent in English, Bisaya/Cebuano, and Tagalog/Filipino. Respond naturally in the user's detected language (${lang}). Maintain a professional, articulate, and friendly tone with Markdown formatting, bullet points, and clear headers.`;
      
      const payload = {
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${userPrompt}` }] }
        ]
      };

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (err) {
      console.warn('[chatbot] Gemini API error:', err.message);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `You are Haribon AI, the intelligent assistant for DASIG Consortium (Region VII). Respond fluently in ${lang} with Markdown formatting.` },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err) {
      console.warn('[chatbot] OpenAI API error:', err.message);
    }
  }

  return null;
}

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  const trimmed = message.trim();
  const normalized = trimmed.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/gu, '');
  
  // 1. Detect User's Language
  const lang = detectLanguage(normalized);

  // 2. Check if this is a Calendar Month Query (e.g. "september", "events in october", "setyembre 2026")
  const monthMatch = detectMonthQuery(normalized);
  if (monthMatch) {
    try {
      const [eventsRes, trainRes] = await Promise.all([
        supabase.from('events').select('id, title, date, venue, category, organizer, enrolled, total').order('id', { ascending: true }),
        supabase.from('trainings').select('id, title, duration, level, schedule, category, org').order('id', { ascending: true }),
      ]);

      const allEvents = eventsRes.data || [];
      const allTrainings = trainRes.data || [];

      // Filter events/trainings matching this month prefix (e.g. 'Sep', 'Oct', 'Nov', 'Dec', etc.)
      const matchedEvents = allEvents.filter(e => (e.date && (e.date.includes(monthMatch.prefix) || e.date.toLowerCase().includes(monthMatch.token))));
      const matchedTrainings = allTrainings.filter(t => (t.schedule && (t.schedule.includes(monthMatch.prefix) || t.schedule.toLowerCase().includes(monthMatch.token))));

      if (matchedEvents.length > 0 || matchedTrainings.length > 0) {
        let reply = '';
        if (lang === 'bisaya') {
          reply = `📅 **Mga Kalihokan ug Training sa ${monthMatch.original} 2026:**\n\n`;
          if (matchedEvents.length > 0) {
            reply += `### 🏛️ Consortium Events:\n` + matchedEvents.map(e => `• **${e.title}**\n  📅 **Petsa:** ${e.date}\n  📍 **Lugar:** ${e.venue || 'TBA'}\n  👥 **Slots:** ${e.enrolled || 0}/${e.total || 50} rehistrado\n`).join('\n');
          }
          if (matchedTrainings.length > 0) {
            reply += `\n### 🎓 Faculty & Technical Bootcamps:\n` + matchedTrainings.map(t => `• **${t.title}**\n  ⏱️ **Gidugayon:** ${t.duration} (${t.level})\n  🏛️ **Organized by:** ${t.org}\n`).join('\n');
          }
          reply += `\n👉 *Mahimo kang magparehistro direkta sa [Programs Module](/programs?tab=events)!*`;
        } else if (lang === 'tagalog') {
          reply = `📅 **Mga Kaganapan at Pagsasanay para sa ${monthMatch.original} 2026:**\n\n`;
          if (matchedEvents.length > 0) {
            reply += `### 🏛️ Consortium Events:\n` + matchedEvents.map(e => `• **${e.title}**\n  📅 **Petsa:** ${e.date}\n  📍 **Lugar:** ${e.venue || 'TBA'}\n  👥 **Slots:** ${e.enrolled || 0}/${e.total || 50} rehistrado\n`).join('\n');
          }
          if (matchedTrainings.length > 0) {
            reply += `\n### 🎓 Faculty & Technical Bootcamps:\n` + matchedTrainings.map(t => `• **${t.title}**\n  ⏱️ **Tagal:** ${t.duration} (${t.level})\n  🏛️ **Organized by:** ${t.org}\n`).join('\n');
          }
          reply += `\n👉 *Maaari kang magparehistro sa [Programs Module](/programs?tab=events)!*`;
        } else {
          reply = `📅 **Consortium Schedule for ${monthMatch.original} 2026:**\n\n`;
          if (matchedEvents.length > 0) {
            reply += `### 🏛️ Consortium Events:\n` + matchedEvents.map(e => `• **${e.title}**\n  📅 **Date:** ${e.date}\n  📍 **Venue:** ${e.venue || 'TBA'}\n  👥 **Capacity:** ${e.enrolled || 0}/${e.total || 50} registered\n`).join('\n');
          }
          if (matchedTrainings.length > 0) {
            reply += `\n### 🎓 Faculty & Technical Bootcamps:\n` + matchedTrainings.map(t => `• **${t.title}**\n  ⏱️ **Duration:** ${t.duration} (${t.level})\n  🏛️ **Organized by:** ${t.org}\n`).join('\n');
          }
          reply += `\n👉 *You can register directly in the [Programs Module](/programs?tab=events)!*`;
        }

        return res.json({
          reply,
          matched: true,
          intent: 'events_month',
          score: 10,
          language: lang,
          followups: MULTI_FOLLOWUPS[lang],
          navigate_to: '/programs?tab=events',
          suggestions: []
        });
      }
    } catch (err) {
      console.warn('[chatbot] Month query error:', err.message);
    }
  }

  // 3. High-Accuracy NLP Intent Scoring
  let matchedResult = matchIntent(normalized);
  let match = matchedResult ? matchedResult.entry : null;
  let bestScore = matchedResult ? matchedResult.score : 0;

  // 4. Typo-Tolerant Fuzzy Matching Fallback
  if (!match || bestScore < 1.5) {
    const inputWords = normalized.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
    let fuzzyBest = null;
    let fuzzyBestScore = 0;

    for (const entry of KB) {
      let fScore = 0;
      for (const kw of entry.keywords) {
        const kwWords = kw.toLowerCase().split(/\s+/);
        for (const iw of inputWords) {
          for (const kw2 of kwWords) {
            if (kw2.length >= 3 && levenshtein(iw, kw2) <= 1) fScore += 1.5;
          }
        }
      }
      if (fScore > fuzzyBestScore) {
        fuzzyBestScore = fScore;
        fuzzyBest = entry;
      }
    }
    if (fuzzyBest && fuzzyBestScore >= 1.5) {
      match = fuzzyBest;
      bestScore = fuzzyBestScore;
    }
  }

  // 5. Cross-Table Semantic Database Search if not matched
  if (!match) {
    try {
      const searchTerms = normalized.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
      if (searchTerms.length > 0) {
        const [evs, trs, nws, fnd] = await Promise.all([
          supabase.from('events').select('title, date, venue').limit(10),
          supabase.from('trainings').select('title, org, duration').limit(10),
          supabase.from('news').select('title, category, date').limit(10),
          supabase.from('funding_opportunities').select('title, funding_agency').limit(10),
        ]);

        const hits = [];
        (evs.data || []).forEach(e => {
          if (searchTerms.some(st => e.title.toLowerCase().includes(st) || (e.venue && e.venue.toLowerCase().includes(st)))) {
            hits.push(`📅 **Event:** ${e.title} (${e.date || 'TBA'})`);
          }
        });
        (trs.data || []).forEach(t => {
          if (searchTerms.some(st => t.title.toLowerCase().includes(st) || (t.org && t.org.toLowerCase().includes(st)))) {
            hits.push(`🎓 **Training:** ${t.title} by ${t.org}`);
          }
        });
        (nws.data || []).forEach(n => {
          if (searchTerms.some(st => n.title.toLowerCase().includes(st))) {
            hits.push(`📰 **News:** ${n.title}`);
          }
        });

        if (hits.length > 0) {
          let dynamicReply = '';
          if (lang === 'bisaya') {
            dynamicReply = `🔍 **Nakakita ko og mga may kalabotan nga resulta sa DASIG Database:**\n\n${hits.slice(0, 4).join('\n')}\n\n💡 *Gusto ka ba og dugang impormasyon bahin sa bisan asa niini?*`;
          } else if (lang === 'tagalog') {
            dynamicReply = `🔍 **May natagpuan akong may kaugnayang resulta sa DASIG Database:**\n\n${hits.slice(0, 4).join('\n')}\n\n💡 *Nais mo bang malaman ang higit pang detalye tungkol dito?*`;
          } else {
            dynamicReply = `🔍 **I found relevant matches in the DASIG Consortium Database:**\n\n${hits.slice(0, 4).join('\n')}\n\n💡 *Would you like more details about any of these?*`;
          }

          return res.json({
            reply: dynamicReply,
            matched: true,
            intent: 'database_search',
            score: 8.0,
            language: lang,
            followups: MULTI_FOLLOWUPS[lang],
            navigate_to: null,
            suggestions: []
          });
        }
      }
    } catch (err) {
      console.warn('[chatbot] Cross-table search error:', err.message);
    }
  }

  // 6. Check Generative LLM if query is open-ended
  let generatedReply = null;
  if (!match) {
    generatedReply = await callGenerativeLLM(normalized, lang);
  }

  // 7. Log interaction telemetry (fire-and-forget)
  Promise.resolve(
    supabase.from('chatbot_logs').insert({
      message: normalized,
      matched: !!match || !!generatedReply,
      intent: match ? match.intent : (generatedReply ? 'generative_ai' : null),
    })
  ).catch(err => console.warn('[chatbot] Log error:', err.message));

  // If Generative LLM generated a reply
  if (generatedReply) {
    return res.json({
      reply: generatedReply,
      matched: true,
      intent: 'generative_ai',
      score: 1.0,
      language: lang,
      followups: MULTI_FOLLOWUPS[lang],
      navigate_to: null,
      suggestions: []
    });
  }

  // 8. If No Match Found — Deliver Polite Multilingual Guidance
  if (!match) {
    const unmatchedFallbacks = {
      english: "I understand your question! As Haribon AI, I specialize in consortium events, research grants, faculty training, and governance policies in Region VII. Feel free to rephrase or explore one of the suggested topics below:",
      bisaya: "Nakasabot ko sa imong pangutana! Isip Haribon AI, espesyalista ko sa mga kalihokan sa konsorsyum, research grants, faculty training, ug mga polisiya sa Rehiyon VII. Pwede nimo usbon ang imong pangutana o mopili sa mga topiko sa ubos:",
      tagalog: "Nauunawaan ko ang iyong tanong! Bilang Haribon AI, dalubhasa ako sa mga kaganapan ng konsorsyum, research grants, faculty training, at patakaran sa Rehiyon VII. Maaari mong baguhin ang iyong tanong o pumili sa mga paksa sa ibaba:"
    };

    const suggestions = [
      { intent: 'events', sample: lang === 'bisaya' ? 'Unsay mga umaabot nga events?' : lang === 'tagalog' ? 'Anong mga events ang paparating?' : 'What events are coming up?' },
      { intent: 'membership', sample: lang === 'bisaya' ? 'Unsaon pag-apil sa DASIG?' : lang === 'tagalog' ? 'Paano sumali sa DASIG?' : 'How do I become a DASIG member?' },
      { intent: 'training', sample: lang === 'bisaya' ? 'Unsay mga training programs?' : lang === 'tagalog' ? 'Anong training programs ang meron?' : 'What training programs are available?' },
    ];

    return res.json({
      reply: unmatchedFallbacks[lang],
      matched: false,
      intent: null,
      score: 0,
      language: lang,
      followups: MULTI_FOLLOWUPS[lang],
      navigate_to: null,
      suggestions
    });
  }

  // 9. Select Appropriate Language Reply
  let reply = match.reply_en;
  if (lang === 'bisaya' && match.reply_ceb) reply = match.reply_ceb;
  if (lang === 'tagalog' && match.reply_tgl) reply = match.reply_tgl;

  // 10. Dynamic Real-Time Supabase Database Enrichment
  const uniq = (arr, key) => {
    const seen = new Set();
    return arr.filter(r => { const v = r[key]; return seen.has(v) ? false : seen.add(v); });
  };

  try {
    if (match.intent === 'events') {
      const { data } = await supabase.from('events').select('title, date, venue, category').order('id', { ascending: true }).limit(5);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 4);
        const list = items.map(e => `• **${e.title}** — 📅 ${e.date || 'TBA'}${e.venue ? ' (📍 ' + e.venue + ')' : ''}`).join('\n');
        
        if (lang === 'bisaya') {
          reply = `${reply}\n\n📅 **Mga umaabot nga kalihokan:**\n${list}\n\n💡 *Pag-rehistro og sayo sa Programs module tungod kay limitado ang mga slots!*`;
        } else if (lang === 'tagalog') {
          reply = `${reply}\n\n📅 **Mga paparating na kaganapan:**\n${list}\n\n💡 *Magparehistro nang maaga sa Programs module dahil limitado ang mga puwesto!*`;
        } else {
          reply = `${reply}\n\n📅 **Upcoming schedule:**\n${list}\n\n💡 *Register early in the Programs module — slots are limited!*`;
        }
      }
    } else if (match.intent === 'training') {
      const { data } = await supabase.from('trainings').select('title, category, level').limit(5);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 4);
        const list = items.map(t => `• **${t.title}**${t.category ? ' [' + t.category + ']' : ''}${t.level ? ' — ' + t.level : ''}`).join('\n');
        
        if (lang === 'bisaya') {
          reply = `${reply}\n\n🎓 **Mga programa nga mapilian:**\n${list}\n\n👉 *Tan-awa ang tanan sa Training module!*`;
        } else if (lang === 'tagalog') {
          reply = `${reply}\n\n🎓 **Mga itinatampok na programa:**\n${list}\n\n👉 *Tingnan ang lahat sa Training module!*`;
        } else {
          reply = `${reply}\n\n🎓 **Featured programs:**\n${list}\n\n👉 *Browse all in the Training module!*`;
        }
      }
    } else if (match.intent === 'funding') {
      const { data } = await supabase.from('funding_opportunities').select('title, category, status').eq('status', 'Open').limit(5);
      if (data && data.length > 0) {
        const items = uniq(data, 'title').slice(0, 4);
        const list = items.map(f => `• **${f.title}**${f.category ? ' [' + f.category + ']' : ''}`).join('\n');
        
        if (lang === 'bisaya') {
          reply = `${reply}\n\n💰 **Bukas nga mga pondo karon:**\n${list}\n\n👉 *Tan-awa ang eligibility sa Funding module!*`;
        } else if (lang === 'tagalog') {
          reply = `${reply}\n\n💰 **Kasalukuyang bukas na pondo:**\n${list}\n\n👉 *Tingnan ang eligibility sa Funding module!*`;
        } else {
          reply = `${reply}\n\n💰 **Currently open grants:**\n${list}\n\n👉 *View eligibility in the Funding module!*`;
        }
      }
    }
  } catch (err) {
    console.warn('[chatbot] DB enrichment error:', err.message);
  }

  // 11. Navigation Target Mapping
  const PAGE_LINKS = {
    events: '/programs?tab=events', event_register: '/programs?tab=events',
    training: '/programs?tab=training', certificate: '/programs?tab=training',
    funding: '/funding', policy: '/policies', partnerships: '/partnerships',
    membership: '/membership', login: '/login', forgot_password: '/forgot-password',
    haribon: '/chatbot', contact: '/contact-admin', member_institutions: '/members'
  };

  return res.json({
    reply,
    matched: true,
    intent: match.intent,
    score: bestScore,
    language: lang,
    followups: MULTI_FOLLOWUPS[lang],
    navigate_to: PAGE_LINKS[match.intent] || null,
  });
});

// GET /api/chatbot/intents
router.get('/intents', (req, res) => {
  res.json(KB.map(k => ({ intent: k.intent, sample: k.keywords[0] })));
});

module.exports = router;
