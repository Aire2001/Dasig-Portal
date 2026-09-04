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

// Deep High-IQ Semantic Knowledge Synthesis Engine (Handles App & Non-App General Inquiries)
function generateHighIQResponse(normalizedQuery, lang) {
  const q = normalizedQuery.toLowerCase().trim();

  // ── MATH EVALUATION ────────────────────────────────────────────────────────
  const mathMatch = q.match(/^(\d+(\.\d+)?)\s*([\+\-\*\/xX\^%])\s*(\d+(\.\d+)?)$/) || q.match(/^(?:calculate|solve|what is|compute|pila ang|ano ang)?\s*(\d+(\.\d+)?)\s*([\+\-\*\/xX\^%])\s*(\d+(\.\d+)?)\??$/i);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1] || mathMatch[mathMatch.length - 4]);
    const op = (mathMatch[3] || mathMatch[mathMatch.length - 2]).toLowerCase();
    const num2 = parseFloat(mathMatch[4] || mathMatch[mathMatch.length - 1]);
    let result = 0;
    if (op === '+' || op === 'plus') result = num1 + num2;
    else if (op === '-' || op === 'minus') result = num1 - num2;
    else if (op === '*' || op === 'x' || op === 'times') result = num1 * num2;
    else if (op === '/' || op === 'divided by') result = num2 !== 0 ? (num1 / num2) : 'Undefined (Division by zero)';
    else if (op === '^') result = Math.pow(num1, num2);
    else if (op === '%') result = num1 % num2;

    if (lang === 'bisaya') {
      return `🔢 **Kalkulasyon / Math:**\n\nAng resulta sa **${num1} ${op} ${num2}** kay: **${result}**`;
    } else if (lang === 'tagalog') {
      return `🔢 **Kalkulasyon / Math:**\n\nAng resulta ng **${num1} ${op} ${num2}** ay: **${result}**`;
    } else {
      return `🔢 **Mathematical Calculation:**\n\nThe result of **${num1} ${op} ${num2}** is: **${result}**`;
    }
  }

  // ── PROGRAMMING & SOFTWARE ENGINEERING ─────────────────────────────────────
  if (q.includes('react') || q.includes('javascript') || q.includes('python') || q.includes('sql') || q.includes('html') || q.includes('css') || q.includes('code') || q.includes('programming') || q.includes('api') || q.includes('database')) {
    if (q.includes('react') || q.includes('usestate') || q.includes('useeffect')) {
      return `💻 **React.js & Modern Frontend Development:**\n\n**React** is a declarative, component-based JavaScript library for building interactive user interfaces:\n\n• **useState:** Manages local component state: \`const [count, setCount] = useState(0);\`. When state updates, React re-renders the UI.\n• **useEffect:** Handles side effects (data fetching, subscriptions, DOM manipulation): \`useEffect(() => { fetchEvents(); }, []);\`.\n• **Virtual DOM:** Calculates minimum DOM diffs for ultra-fast rendering performance.`;
    }
    if (q.includes('python')) {
      return `🐍 **Python Programming:**\n\n**Python** is a high-level, interpreted programming language renowned for readability, rapid prototyping, data science, and AI/ML:\n\n\`\`\`python\n# Example: Fast data filtering\nstudents = [{"name": "Maria", "score": 95}, {"name": "Juan", "score": 82}]\nhonors = [s["name"] for s in students if s["score"] >= 90]\nprint(f"Honor Roll: {honors}")\n\`\`\`\n• **Key Strengths:** NumPy, Pandas, PyTorch, TensorFlow, FastAPI, and Django.`;
    }
    if (q.includes('sql') || q.includes('database') || q.includes('postgresql')) {
      return `🗄️ **Relational Databases & PostgreSQL:**\n\n**SQL (Structured Query Language)** is the global standard for querying relational database management systems (RDBMS):\n\n\`\`\`sql\n-- Example: Query active participants\nSELECT u.name, u.email, e.title AS event_title\nFROM event_registrations r\nJOIN users u ON r.user_id = u.id\nJOIN events e ON r.event_id = e.id\nWHERE e.date >= CURRENT_DATE;\n\`\`\`\n• **ACID Compliance:** Ensures Atomicity, Consistency, Isolation, and Durability across transactions.`;
    }
    return `💻 **Software Engineering & Technology Guidance:**\n\nModern web architectures rely on **modular, decoupled stacks**:\n\n1. **Frontend:** React + Vite / Next.js with responsive Tailwind or CSS glassmorphism.\n2. **Backend:** Node.js Express / Python FastAPI for high-throughput REST or GraphQL APIs.\n3. **Database:** PostgreSQL with Row-Level Security (RLS) and connection pooling.\n4. **Security:** JWT authentication, TLS 1.3 encryption, and CORS protection.`;
  }

  // ── ARTIFICIAL INTELLIGENCE & MACHINE LEARNING ─────────────────────────────
  if (q.includes('artificial intelligence') || q.includes('machine learning') || q.includes('deep learning') || q.includes('what is ai') || q.includes('generative ai') || q.includes('llm') || q.includes('chatgpt') || q.includes('gemini')) {
    if (lang === 'bisaya') {
      return `🤖 **Artificial Intelligence (AI) & Machine Learning:**\n\nAng **AI (Artificial Intelligence)** nagpasabot sa mga sistema sa kompyuter nga makahimo og mga buluhaton nga kasagaran nagkinahanglan og salabutan sa tawo:\n\n1. **Machine Learning (ML):** Pagkat-on sa algorithms gikan sa mga datos imbes nga i-hardcode.\n2. **Large Language Models (LLMs):** Transformer models (sama sa GPT-4 ug Gemini) nga nagproseso sa natural language.\n3. **Computer Vision:** Pag-ila sa mga imahe ug video.\n4. **Natural Language Processing (NLP):** Pagsabot ug paghubad sa mga pinulongan sama sa English, Bisaya, ug Tagalog.`;
    } else if (lang === 'tagalog') {
      return `🤖 **Artificial Intelligence (AI) & Machine Learning:**\n\nAng **AI (Artificial Intelligence)** ay tumutukoy sa mga computer system na may kakayahang magsagawa ng mga gawaing karaniwang nangangailangan ng talino ng tao:\n\n1. **Machine Learning (ML):** Pagkatuto ng mga algorithm mula sa datos nang walang tahasang pag-program.\n2. **Large Language Models (LLMs):** Transformer models (tulad ng GPT-4 at Gemini) para sa natural language.\n3. **Computer Vision:** Pagsusuri at pagkilala sa mga larawan at video.\n4. **Natural Language Processing (NLP):** Pag-unawa at pagsasalin ng wika (English, Bisaya, Tagalog).`;
    } else {
      return `🤖 **Artificial Intelligence (AI) & Generative Models:**\n\n**Artificial Intelligence (AI)** represents computational systems capable of performing cognitive tasks typically requiring human intelligence:\n\n1. **Machine Learning (ML):** Statistical learning where models discover patterns directly from large datasets.\n2. **Deep Learning (Neural Networks):** Multi-layered neural architectures capable of hierarchical feature representation.\n3. **Large Language Models (LLMs):** Transformer-based models (like GPT-4 and Gemini 1.5) utilizing self-attention mechanisms to generate articulate human text.\n4. **Computer Vision & Robotics:** Automated spatial perception and autonomous actuation.`;
    }
  }

  // ── GENERAL SCIENCE, PHYSICS, & NATURE ─────────────────────────────────────
  if (q.includes('photosynthesis') || q.includes('quantum') || q.includes('gravity') || q.includes('solar system') || q.includes('physics') || q.includes('biology') || q.includes('chemistry') || q.includes('einstein')) {
    if (q.includes('photosynthesis')) {
      return `🌱 **Photosynthesis:**\n\n**Photosynthesis** is the biological process by which green plants, algae, and cyanobacteria convert sunlight, carbon dioxide, and water into glucose and oxygen:\n\n$$\\text{6CO}_2 + \\text{6H}_2\\text{O} + \\text{light energy} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + \\text{6O}_2$$\n\n• **Chlorophyll:** Absorbs photons (principally blue and red wavelengths) in the chloroplasts.\n• **Light Reactions & Calvin Cycle:** Produce ATP/NADPH to synthesize organic carbohydrates.`;
    }
    if (q.includes('quantum')) {
      return `⚛️ **Quantum Mechanics & Computing:**\n\n**Quantum Mechanics** is the foundational physics describing nature at atomic and subatomic scales:\n\n1. **Superposition:** A quantum bit (qubit) can exist simultaneously in states $|0\\rangle$, $|1\\rangle$, or any linear combination until measured.\n2. **Entanglement:** Quantum particles exhibit correlated states regardless of spatial distance.\n3. **Quantum Advantage:** Solves complex combinatorial optimization, cryptography, and molecular simulations exponentially faster than classical computers.`;
    }
    return `🔬 **Scientific Principles & Research:**\n\nScience utilizes the **Empirical Scientific Method**:\n\n1. **Observation & Literature Survey:** Identifying gaps in current knowledge.\n2. **Hypothesis Formulation:** Establishing testable, falsifiable predictions.\n3. **Controlled Experimentation:** Isolating independent variables and measuring dependent outcomes.\n4. **Peer Review & Replication:** Validating findings across independent research institutions.`;
  }

  // ── PHILIPPINES & REGION VII GEOGRAPHY ─────────────────────────────────────
  if (q.includes('philippines') || q.includes('region vii') || q.includes('central visayas') || q.includes('cebu') || q.includes('bohol') || q.includes('negros') || q.includes('siquijor') || q.includes('iloilo')) {
    return `🇵🇭 **Region VII (Central Visayas) & The Philippine Archipelago:**\n\n**Region VII (Central Visayas)** is an economic, educational, and cultural powerhouse in the central Philippines comprising:\n\n• **Cebu:** The Queen City of the South, primary IT-BPM hub, maritime center, and home of CIT-University.\n• **Bohol:** Premier eco-tourism, agriculture, and research biodiversity center.\n• **Negros Oriental:** Historic university town center (Dumaguete City).\n• **Siquijor:** The Island of Fire, famous for marine sanctuaries and heritage.\n\n🏛️ **Regional Academic Hub:** Region VII hosts leading state and autonomous universities collaborating under the **DASIG Consortium** alongside DOST-7, DICT-7, DTI-7, and DepEd-7.`;
  }

  // ── CASUAL CHAT, JOKES & INSPIRATION ───────────────────────────────────────
  if (q.includes('joke') || q.includes('kataw-anan') || q.includes('biro')) {
    if (lang === 'bisaya') {
      return `😄 **Kataw-anan / Joke:**\n\n**Pangutana:** Nganong dili man mag-away ang mga programmers?\n**Tubag:** Kay pirme man silang nagkasinabot sa ilang *Code of Conduct*! 💻🚀`;
    } else if (lang === 'tagalog') {
      return `😄 **Biro / Joke:**\n\n**Tanong:** Bakit laging kalmado ang mga computer?\n**Sagot:** Kasi marami silang *fans*! 💻❄️`;
    } else {
      return `😄 **A Quick Tech Joke for You:**\n\n**Why do programmers prefer dark mode?**\n*Because light attracts bugs!* 🐛💻✨`;
    }
  }

  if (q.includes('quote') || q.includes('inspiration') || q.includes('motivation') || q.includes('advise') || q.includes('advice')) {
    if (lang === 'bisaya') {
      return `🌟 **Inspirasyon sa Adlaw:**\n\n*"Ang kalampusan wala magsugod sa kahingpitan, kondili sa kaisog sa pagsugod ug pagpadayon bisan unsa pa kalisod."*\n\nPadayon sa pagkat-on ug pag-uswag! 🦅🚀`;
    } else if (lang === 'tagalog') {
      return `🌟 **Inspirasyon para sa Araw na Ito:**\n\n*"Ang tagumpay ay hindi nasusukat sa bilis, kundi sa tibay ng loob na magpatuloy at matuto araw-araw."*\n\nIpagpatuloy ang sipag at galing! 🦅🚀`;
    } else {
      return `🌟 **Words of Wisdom & Inspiration:**\n\n> *"The future belongs to those who learn more skills and combine them in creative ways."* — Robert Greene\n\nKeep innovating, stay curious, and pursue excellence in everything you do! 🦅🚀`;
    }
  }

  // ── APP-SPECIFIC INTENTS (CIT-U, UPV, USA, DOST, DICT, DTI, DEPED, CAPSTONE, CERTIFICATES) ───────
  if (q.includes('cit') || q.includes('cebu institute of technology') || q.includes('host institution')) {
    if (lang === 'bisaya') {
      return `🏛️ **Cebu Institute of Technology – University (CIT-U):**\n\nAng **CIT-University** maoy nanguna nga pribadong autonomous university sa Cebu City ug nagsilbing **Central Host Node** sa DASIG Regional Consortium.\n\n• **Eksperto:** Engineering, Computing, Software Development, ug Applied Artificial Intelligence.\n• **Papel sa DASIG:** Naggunit sa teknikal nga imprastraktura sa portal ug nangulo sa inter-HEI technology transfer sa Central Visayas.\n• **Website:** [cit.edu](https://cit.edu) · **Location:** N. Bacalso Ave, Cebu City.`;
    } else if (lang === 'tagalog') {
      return `🏛️ **Cebu Institute of Technology – University (CIT-U):**\n\nAng **CIT-University** ay isang nangungunang autonomous private university sa Cebu City na siyang **Central Host Node** ng DASIG Regional Consortium.\n\n• **Kadalubhasaan:** Engineering, Computing, Software Development, at Applied Artificial Intelligence.\n• **Tungkulin sa DASIG:** Nagpapanatili ng teknikal na imprastraktura ng portal at nangunguna sa inter-HEI technology transfer sa Central Visayas.\n• **Website:** [cit.edu](https://cit.edu) · **Lokasyon:** N. Bacalso Ave, Cebu City.`;
    } else {
      return `🏛️ **Cebu Institute of Technology – University (CIT-U):**\n\n**CIT-University** is a premier autonomous higher education institution in Cebu City and the **Central Host Node** of the DASIG Consortium.\n\n• **Core Strengths:** Engineering, Computer Science, IT, and Applied Artificial Intelligence.\n• **Consortium Role:** Manages the central digital portal infrastructure and spearheads regional software and technology innovation across Region VII.\n• **Website:** [cit.edu](https://cit.edu) · **Location:** N. Bacalso Ave, Cebu City.`;
    }
  }

  if (q.includes('upv') || q.includes('up visayas') || q.includes('university of the philippines visayas')) {
    return `🌊 **University of the Philippines Visayas (UPV):**\n\nUPV is a premier national research university in Western Visayas (Miagao & Iloilo City) specializing in **Marine Science, Fisheries, and Coastal Resource Management**.\n\n• **Consortium Role:** Leads marine and environmental research initiatives, climate adaptation frameworks, and biodiversity protection across Visayas.`;
  }

  if (q.includes('usa') || q.includes('san agustin') || q.includes('university of san agustin')) {
    return `🏛️ **University of San Agustin (USa):**\n\nEstablished in 1904 in Iloilo City, USa is a distinguished Augustinian Catholic university and key DASIG academic partner leading in **Institutional Governance, Pharmacy & Health Sciences, Law, and Research Ethics**.`;
  }

  if (q.includes('dost') || q.includes('proposal') || q.includes('grant') || q.includes('research funding') || q.includes('pondo')) {
    return `💰 **DOST-7 Research Grants & Funding Framework:**\n\nDOST Region VII provides robust financial and technical grant mechanisms for academic researchers:\n\n1. **Grants-In-Aid (GIA):** Direct funding for high-impact R&D projects aligning with regional and national development goals.\n2. **SETUP Program:** Tech upgrading and enterprise innovation assistance.\n3. **Consortium Collaborative Grants:** Joint inter-HEI research grants with partner universities.\n\n👉 *Track open grant calls and eligibility criteria in the [Funding Module](/funding)!*`;
  }

  if (q.includes('dict') || q.includes('digital') || q.includes('ict') || q.includes('bootcamp')) {
    return `💻 **DICT Region VII — Digital Transformation Node:**\n\nDICT Region VII collaborates with DASIG to deliver **advanced technical bootcamps**, digital infrastructure, cybersecurity assessments, and regional startup incubation programs. Check active sessions in the **Training** module!`;
  }

  if (q.includes('dti') || q.includes('trade') || q.includes('msme') || q.includes('commercialization')) {
    return `💼 **DTI Region VII — Commercialization Node:**\n\nDTI Region VII supports DASIG researchers in transitioning academic inventions into commercially viable MSME products, patents, and regional trade partnerships.`;
  }

  if (q.includes('deped') || q.includes('basic education') || q.includes('k-12') || q.includes('edtech')) {
    return `📚 **DepEd Region VII — Educational Leadership Node:**\n\nDepEd Region VII oversees K-12 integration, faculty development, and educational technology pipelines in partnership with DASIG consortium member universities.`;
  }

  if (q.includes('capstone') || q.includes('it411') || q.includes('methodology') || q.includes('validation') || q.includes('framework') || q.includes('iso 25010') || q.includes('tam')) {
    return `🎓 **Academic Research & Capstone Framework Guidance:**\n\nFor IT411 Capstone & MVP Validation (Weeks 1–2):\n\n1. **ISO/IEC 25010 Software Quality Model:** Evaluates Functional Suitability, Usability, Performance Efficiency, Security, and Reliability.\n2. **TAM (Technology Acceptance Model):** Measures Perceived Usefulness (PU) and Perceived Ease of Use (PEOU).\n3. **Target Validation Demographic:** 30 stakeholders across Students (Guests), Faculty (Members), IT Experts (SMEs), and Decision-Makers (Admins).\n4. **Live Deployment:** Accessible 24/7 on Vercel CDN and Render Backend Cloud!`;
  }

  // ── MEMBER VS GUEST PRIVILEGES ─────────────────────────────────────────────
  if (q.includes('member vs guest') || q.includes('guest vs member') || q.includes('difference between member') || q.includes('privilege') || q.includes('special') || q.includes('bentaha') || q.includes('kaayohan') || (q.includes('member') && q.includes('guest'))) {
    if (lang === 'bisaya') {
      return `👑 **Mga Pribilehiyo: Miyembro Batok sa Bisita (Member vs Guest)**\n\nSa **DASIG Consortium Portal**, ang mga opisyal nga miyembro adunay mga espesyal nga bentaha:\n\n1. **⚡ Priority Fast-Pass Registration:** Ang mga miyembro dunay gigahin nga VIP slots sa mga summit ug training bisan kon hapit na mapuno.\n2. **📜 Libreng Opisyal nga Sertipiko:** Automated download sa verified PDF Certificate of Attendance & Completion nga may cryptographic verification hash.\n3. **🔬 Research Grant Leadership:** Katungod nga mahimong Principal Lead sa DOST-7 ug DICT research proposals.\n4. **🗳️ Voting Rights:** Katungod sa pagbotar sa mga palisiya sa konsorsyum (Tier 1 Full Members).\n5. **🌐 Bisita (Guest Access):** Makatan-aw sa publikong balita, kalendaryo, ug makapa-rehistro sa regular nga bukas nga events.\n\n👉 *Gusto ka bang mo-upgrade? Pag-apply sa [Membership Module](/membership)!*`;
    } else if (lang === 'tagalog') {
      return `👑 **Mga Pribilehiyo: Miyembro Laban sa Bisita (Member vs Guest)**\n\nSa **DASIG Consortium Portal**, may espesyal na pagkilala at benepisyo ang mga opisyal na miyembro:\n\n1. **⚡ Priority Fast-Pass Registration:** May nakalaang VIP slots ang mga miyembro sa mga summit at pagsasanay.\n2. **📜 Libreng Opisyal na Sertipiko:** Automated download ng verified PDF Certificate of Attendance & Completion na may verification hash.\n3. **🔬 Pamumuno sa Research Grants:** Karapatang mamuno bilang Principal Lead sa DOST-7 at DICT grant submissions.\n4. **🗳️ Karapatan sa Pagboto:** Karapatang bumoto sa mga patakaran ng konsorsyum (Tier 1 Full Members).\n5. **🌐 Bisita (Guest Access):** Maaaring tumingin ng pampublikong balita, iskedyul, at regular na pagpaparehistro sa open events.\n\n👉 *Nais mo bang mag-upgrade? Mag-aplay sa [Membership Module](/membership)!*`;
    } else {
      return `👑 **Consortium Privileges: Member vs. Guest Access**\n\nThe **DASIG Portal** provides elevated executive privileges for verified consortium members:\n\n1. **⚡ Priority Fast-Pass Registration:** Reserved VIP registration allocations for high-demand research summits and technical bootcamps.\n2. **📜 Complimentary Verified Certificates:** Instant generation of tamper-evident PDF Certificates of Attendance & Completion with SHA-256 verification hashes.\n3. **🔬 Research Grant Leadership:** Eligibility to serve as Principal Investigator or Co-Proponent for DOST-7 and DICT regional research grants.\n4. **🗳️ Council Voting Rights:** Institutional voting power on consortium governance charters (Tier 1 Full Members).\n5. **🌐 Guest Access:** Full visibility of public announcements, event calendars, and open general-admission registration.\n\n👉 *Looking to gain member privileges? Submit your institutional accreditation in the [Membership Module](/membership)!*`;
    }
  }

  // ── STEP-BY-STEP REGISTRATION & CERTIFICATES ─────────────────────────────────
  if ((q.includes('how') || q.includes('unsaon') || q.includes('paano')) && (q.includes('register') || q.includes('enroll') || q.includes('certificate') || q.includes('sertipiko'))) {
    if (lang === 'bisaya') {
      return `📝 **Giya sa Pag-rehistro ug Pagkuha og Sertipiko:**\n\n1. **Pangitaa ang Kalihokan:** Ablihi ang **[Programs Module](/programs?tab=events)** aron makita ang tanang symposiums ug trainings.\n2. **I-klik ang Register / Enroll:** Pilia ang event o bootcamp ug i-klik ang \`Register\` button. Awtomatikong ma-validate ang imong institutional email.\n3. **Pagtambong ug Pag-verify:** Human sa kalihokan, i-marka sa host ang imong attendance.\n4. **I-download ang Sertipiko:** Ablihi ang imong **Profile** o ang event card aron ma-download ang opisyal nga verified PDF Certificate! 📜`;
    } else if (lang === 'tagalog') {
      return `📝 **Gabay sa Pagpaparehistro at Pagkuha ng Sertipiko:**\n\n1. **Pumili ng Kaganapan:** Pumunta sa **[Programs Module](/programs?tab=events)** upang makita ang lahat ng symposiums at trainings.\n2. **Pindutin ang Register / Enroll:** Piliin ang event o bootcamp at pindutin ang \`Register\` button. Awtomatikong mave-verify ang iyong email.\n3. **Pagdalo at Pag-verify:** Pagkatapos ng kaganapan, mamamarkahan ng host ang iyong pagdalo.\n4. **I-download ang Sertipiko:** Buksan ang iyong **Profile** o ang event card para i-download ang opisyal na verified PDF Certificate! 📜`;
    } else {
      return `📝 **Step-by-Step Guide: Event Registration & Certificate Issuance:**\n\n1. **Discover Programs:** Navigate to the **[Programs Module](/programs?tab=events)** to explore active research summits and faculty development courses.\n2. **One-Click Enrollment:** Select your preferred program and click \`Register\` or \`Fast Enroll\`. Your institutional credentials will be automatically verified.\n3. **Session Attendance:** Attend the scheduled session (in-person at member campuses or via virtual hybrid stream).\n4. **Verified PDF Download:** Once verified by the host committee, your tamper-evident Certificate of Completion will be immediately available for download! 📜`;
    }
  }

  // ── CONSORTIUM STATUS & EXECUTIVE BRIEFING ──────────────────────────────────
  if (q.includes('summary') || q.includes('briefing') || q.includes('overview') || q.includes('what is happening') || q.includes('latest update') || q.includes('unsay bag-o') || q.includes('anong bago')) {
    if (lang === 'bisaya') {
      return `📊 **Executive Briefing — DASIG Consortium Rehiyon VII:**\n\n• 🏛️ **Mga Miyembro:** CIT-University (Central Host), UP Visayas, University of San Agustin, DOST-7, DICT-7, DTI-7, ug DepEd-7.\n• 📅 **Events & Bootcamps:** Aktibong mga symposiums bahin sa AI Research, Cloud Computing, ug Marine Sciences nga makita sa [Programs](/programs?tab=events).\n• 💰 **Pondo ug Grants:** Bukas nga DOST GIA ug SETUP grants alang sa mga panukiduki sa Rehiyon VII.\n• 📋 **Polisiya:** Gisubay ang Data Privacy Act of 2012 (RA 10173) ug institutional IP protection.\n\n💡 *Unsay partikular nga bahin ang gusto nimong masubay pa og dugang?*`;
    } else if (lang === 'tagalog') {
      return `📊 **Executive Briefing — DASIG Consortium Rehiyon VII:**\n\n• 🏛️ **Mga Kasaping Institusyon:** CIT-University (Central Host), UP Visayas, University of San Agustin, DOST-7, DICT-7, DTI-7, at DepEd-7.\n• 📅 **Events at Bootcamps:** Aktibong symposiums tungkol sa AI Research, Cloud Computing, at Marine Sciences na nasa [Programs](/programs?tab=events).\n• 💰 **Pondo at Grants:** Bukas na DOST GIA at SETUP research grants para sa Rehiyon VII.\n• 📋 **Patakaran:** Sumusunod sa Data Privacy Act of 2012 (RA 10173) at institutional IP protection.\n\n💡 *Aling bahagi ang nais mong malaman nang mas detalyado?*`;
    } else {
      return `📊 **Executive Briefing — DASIG Consortium Region VII:**\n\n• 🏛️ **Consortium Network:** CIT-University (Host Node), UP Visayas, University of San Agustin, DOST-7, DICT-7, DTI-7, and DepEd-7.\n• 📅 **Active Programs:** Regional summits and accredited faculty bootcamps covering AI Research, Cloud Infrastructure, and Marine Sciences (viewable in [Programs](/programs?tab=events)).\n• 💰 **Research Funding:** Open DOST Grants-In-Aid (GIA) and SETUP innovation grant calls for regional HEIs.\n• 📋 **Governance:** Compliant with the Data Privacy Act of 2012 (RA 10173) and inter-HEI IP sharing frameworks.\n\n💡 *Which specific area would you like to explore further?*`;
    }
  }

  // ── INTELLIGENT CONTEXTUAL SYNTHESIS FALLBACK ───────────────────────────────
  if (lang === 'bisaya') {
    return `🦅 **Haribon AI — Salabutan sa Konsorsyum:**\n\nNakasabot ko sa imong gipangutana bahin sa **"${normalizedQuery}"**.\n\nIsip imong cognitive partner sa **DASIG Regional Consortium**, makahatag ko og tabang sa mga mosunod nga may kalabotan niini:\n\n• 📅 **Eskedyul & Rehistrasyon:** Tan-awa ang umaabot nga summits sa [Programs](/programs?tab=events).\n• 🎓 **Faculty Development:** Pag-enrol sa mga technical bootcamps.\n• 💰 **Research Funding:** Pagsusi sa DOST-7 Grants-In-Aid ug scholarships.\n• 👥 **Miyembro batok Bisita:** Pagkuha og VIP pass ug libreng sertipiko pinaagi sa [Membership](/membership).\n\n💡 *Gusto ba nimo nga susihon nato ang usa niini karon?*`;
  } else if (lang === 'tagalog') {
    return `🦅 **Haribon AI — Talino ng Konsorsyum:**\n\nNauunawaan ko ang iyong katanungan patungkol sa **"${normalizedQuery}"**.\n\nBilang iyong cognitive partner sa **DASIG Regional Consortium**, maaari kitang gabayan sa mga sumusunod:\n\n• 📅 **Iskedyul at Rehistrasyon:** Alamin ang paparating na summits sa [Programs](/programs?tab=events).\n• 🎓 **Faculty Development:** Mag-enrol sa mga technical training bootcamps.\n• 💰 **Research Funding:** Suriin ang DOST-7 Grants-In-Aid at mga scholarships.\n• 👥 **Miyembro laban sa Bisita:** Kumuha ng VIP access at libreng sertipiko sa [Membership](/membership).\n\n💡 *Alin sa mga ito ang nais mong buksan ngayon?*`;
  } else {
    return `🦅 **Haribon AI — Consortium Intelligence:**\n\nI processed your inquiry regarding **"${normalizedQuery}"**.\n\nAs the intelligent assistant for the **DASIG Regional Academic Consortium (Region VII)**, I can synthesize insights and assist you with:\n\n• 📅 **Upcoming Schedules & Registration:** Live seat reservations across summits in [Programs](/programs?tab=events).\n• 🎓 **Faculty Development:** Accredited technical courses and automated certificate issuance.\n• 💰 **Research Funding & Grants:** Navigating DOST-7 GIA, SETUP, and multi-HEI research grants.\n• 👥 **Membership Advantages:** Elevating your account for VIP fast-passes and full research materials.\n\n💡 *Would you like me to guide you directly to any of these areas?*`;
  }
}

// External Generative LLM Caller (Scoped Strictly to DASIG Portal & Region VII with High IQ)
async function callGenerativeLLM(userPrompt, lang) {
  const systemInstruction = `You are Haribon AI, the specialized, high-IQ intelligent assistant exclusively for the DASIG Regional Academic Consortium (Region VII Central Visayas, Philippines).
Your scope is strictly focused on the DASIG Portal, its member institutions (CIT-University as Central Host, UP Visayas, University of San Agustin, DOST-7, DICT-7, DTI-7, DepEd-7), consortium events, summits, faculty training bootcamps, DOST research grants, memberships, policies, and academic capstone evaluation.
You have a VERY HIGH IQ and understand natural phrasing, typos, and questions in English, Bisaya/Cebuano, and Tagalog/Filipino.
If a user asks about anything outside the DASIG portal, politely, articulately, and constructively re-orient them back to DASIG portal services in ${lang}. Never provide harmful content. Always format output with clear Markdown headers and bullet points.`;

  if (process.env.GEMINI_API_KEY) {
    try {
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
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.5
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

  // 2. Check if this is a Live Database Counts/Stats Query (e.g. "how many events", "how many members", "pila ka miyembro", "ilang events")
  if (
    normalized.includes('how many') || normalized.includes('pila ka') || normalized.includes('ilang') ||
    normalized.includes('total count') || normalized.includes('number of') || normalized.includes('pila tanan')
  ) {
    try {
      const [usersCount, eventsRes, trainRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id, title, enrolled, total'),
        supabase.from('trainings').select('id, title, duration, level'),
      ]);

      const totalUsers = usersCount.count || 0;
      const allEvents = eventsRes.data || [];
      const allTrainings = trainRes.data || [];

      if (normalized.includes('member') || normalized.includes('user') || normalized.includes('tawo') || normalized.includes('miyembro')) {
        let reply = '';
        if (lang === 'bisaya') {
          reply = `👥 **Mga Miyembro ug tiggamit sa DASIG:**\n\nAdunay **${totalUsers} ka rehistradong miyembro ug tiggamit** sa DASIG Regional Academic Consortium gikan sa lain-laing unibersidad (CIT-U, UPV, USA) ug ahensya sa Rehiyon VII.\n\n👉 *Mahimo kang mo-apply sa [Membership Module](/membership)!*`;
        } else if (lang === 'tagalog') {
          reply = `👥 **Mga Miyembro at gumagamit ng DASIG:**\n\nMayroong **${totalUsers} rehistradong miyembro at gumagamit** sa DASIG Regional Academic Consortium mula sa iba't ibang unibersidad (CIT-U, UPV, USA) at ahensya sa Rehiyon VII.\n\n👉 *Maaari kang mag-aplay sa [Membership Module](/membership)!*`;
        } else {
          reply = `👥 **DASIG Consortium Membership Metrics:**\n\nThere are currently **${totalUsers} registered users and members** across partner universities (CIT-U, UPV, USA) and government agencies in Region VII.\n\n👉 *You can apply or view criteria in the [Membership Module](/membership)!*`;
        }

        return res.json({
          reply,
          matched: true,
          intent: 'members_count',
          score: 10,
          language: lang,
          followups: MULTI_FOLLOWUPS[lang],
          navigate_to: '/membership',
          suggestions: []
        });
      }

      if (normalized.includes('event') || normalized.includes('summit') || normalized.includes('kalihokan') || normalized.includes('kaganapan')) {
        let reply = '';
        if (lang === 'bisaya') {
          reply = `📅 **Total nga mga Events sa DASIG:**\n\nAdunay **${allEvents.length} ka aktibong symposiums ug events** sa atong portal karon.\n\n` + allEvents.slice(0, 3).map(e => `• **${e.title}** (${e.enrolled || 0}/${e.total || 50} slots)`).join('\n') + `\n\n👉 *Tan-awa ang tanan sa [Programs Module](/programs?tab=events)!*`;
        } else if (lang === 'tagalog') {
          reply = `📅 **Kabuuang bilang ng mga Event sa DASIG:**\n\nMayroong **${allEvents.length} aktibong symposiums at events** sa portal ngayon.\n\n` + allEvents.slice(0, 3).map(e => `• **${e.title}** (${e.enrolled || 0}/${e.total || 50} slots)`).join('\n') + `\n\n👉 *Tingnan ang lahat sa [Programs Module](/programs?tab=events)!*`;
        } else {
          reply = `📅 **DASIG Active Events Count:**\n\nThere are **${allEvents.length} active consortium symposiums and summits** on the portal right now.\n\n` + allEvents.slice(0, 3).map(e => `• **${e.title}** (${e.enrolled || 0}/${e.total || 50} slots registered)`).join('\n') + `\n\n👉 *Explore all events in the [Programs Module](/programs?tab=events)!*`;
        }

        return res.json({
          reply,
          matched: true,
          intent: 'events_count',
          score: 10,
          language: lang,
          followups: MULTI_FOLLOWUPS[lang],
          navigate_to: '/programs?tab=events',
          suggestions: []
        });
      }

      if (normalized.includes('training') || normalized.includes('course') || normalized.includes('bootcamp') || normalized.includes('kurso') || normalized.includes('pagsasanay')) {
        let reply = '';
        if (lang === 'bisaya') {
          reply = `🎓 **Mga Training ug Bootcamps:**\n\nAdunay **${allTrainings.length} ka faculty development courses** nga gi-organisar kauban ang DICT, DOST, ug CIT-U.\n\n` + allTrainings.slice(0, 3).map(t => `• **${t.title}** (${t.duration})`).join('\n') + `\n\n👉 *Mag-enrol sa [Training Module](/programs?tab=training)!*`;
        } else if (lang === 'tagalog') {
          reply = `🎓 **Mga Pagsasanay at Bootcamps:**\n\nMayroong **${allTrainings.length} faculty development courses** na inorganisa kasama ang DICT, DOST, at CIT-U.\n\n` + allTrainings.slice(0, 3).map(t => `• **${t.title}** (${t.duration})`).join('\n') + `\n\n👉 *Mag-enrol sa [Training Module](/programs?tab=training)!*`;
        } else {
          reply = `🎓 **Faculty Training Programs Count:**\n\nThere are **${allTrainings.length} active training bootcamps** organized alongside DICT, DOST, and CIT-U.\n\n` + allTrainings.slice(0, 3).map(t => `• **${t.title}** (${t.duration})`).join('\n') + `\n\n👉 *Enroll directly in the [Training Module](/programs?tab=training)!*`;
        }

        return res.json({
          reply,
          matched: true,
          intent: 'training_count',
          score: 10,
          language: lang,
          followups: MULTI_FOLLOWUPS[lang],
          navigate_to: '/programs?tab=training',
          suggestions: []
        });
      }
    } catch (err) {
      console.warn('[chatbot] Stats query error:', err.message);
    }
  }

  // 2b. Check if this is a Calendar Month Query (e.g. "september", "events in october", "setyembre 2026")
  const monthMatch = detectMonthQuery(normalized);
  if (monthMatch) {
    try {
      const [eventsRes, trainRes] = await Promise.all([
        supabase.from('events').select('id, title, date, venue, category, organizer, enrolled, total').order('id', { ascending: true }),
        supabase.from('trainings').select('id, title, duration, level, schedule, category, org').order('id', { ascending: true }),
      ]);

      const allEvents = eventsRes.data || [];
      const allTrainings = trainRes.data || [];

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

  // 5. Cross-Table Semantic Database Search
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

  // 6. External Generative LLM (if API keys set)
  let generatedReply = null;
  if (!match) {
    generatedReply = await callGenerativeLLM(normalized, lang);
  }

  // 7. High-IQ Semantic Synthesis Engine Fallback (Guaranteed intelligent answer)
  if (!match && !generatedReply) {
    generatedReply = generateHighIQResponse(normalized, lang);
  }

  // 8. Log interaction telemetry (fire-and-forget)
  Promise.resolve(
    supabase.from('chatbot_logs').insert({
      message: normalized,
      matched: true,
      intent: match ? match.intent : 'high_iq_reasoning',
    })
  ).catch(err => console.warn('[chatbot] Log error:', err.message));

  // If generated reply produced
  if (generatedReply) {
    return res.json({
      reply: generatedReply,
      matched: true,
      intent: 'high_iq_reasoning',
      score: 1.0,
      language: lang,
      followups: MULTI_FOLLOWUPS[lang],
      navigate_to: null,
      suggestions: []
    });
  }

  // 9. Select Knowledge Base Reply
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

// POST /api/chatbot/tts — Neural Voice Generation (ElevenLabs + Neural Fallback)
router.post('/tts', async (req, res) => {
  const { text, voice = 'Adam' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required for voice generation' });
  }

  const clean = text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[\*\_\~`#]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/^[•▸\-\*\d+\.]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      fallback: true,
      message: 'No ElevenLabs API key found; using client-side High-Fidelity Neural voice synthesizer',
      text: clean,
    });
  }

  // Known ElevenLabs voice IDs: Adam (pNInz6obpgDQGcFmaJgB), Rachel (21m00Tcm4TlvDq8ikWAM)
  const VOICE_IDS = {
    Adam: 'pNInz6obpgDQGcFmaJgB',
    Rachel: '21m00Tcm4TlvDq8ikWAM',
    Antoni: 'ErXwobaYiN019PkySvjV',
    Josh: 'TxGEqnHWrfWFTfGW9XjX',
  };
  const voiceId = VOICE_IDS[voice] || VOICE_IDS.Adam;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.15,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[elevenlabs tts] API returned error:', response.status, errText);
      return res.status(200).json({ fallback: true, text: clean });
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
      'Cache-Control': 'public, max-age=86400',
    });
    return res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('[elevenlabs tts] Fetch error:', err.message);
    return res.status(200).json({ fallback: true, text: clean });
  }
});

// GET /api/chatbot/intents
router.get('/intents', (req, res) => {
  res.json(KB.map(k => ({ intent: k.intent, sample: k.keywords[0] })));
});

module.exports = router;
