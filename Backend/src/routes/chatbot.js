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

// Deep High-IQ Semantic Knowledge Synthesis Engine
function generateHighIQResponse(normalizedQuery, lang) {
  const q = normalizedQuery.toLowerCase();

  // 1. Questions about CIT-University / Host Institution
  if (q.includes('cit') || q.includes('cebu institute of technology') || q.includes('host institution')) {
    if (lang === 'bisaya') {
      return `🏛️ **Cebu Institute of Technology – University (CIT-U):**\n\nAng **CIT-University** maoy nanguna nga pribadong autonomous university sa Cebu City ug nagsilbing **Central Host Node** sa DASIG Regional Consortium.\n\n• **Eksperto:** Engineering, Computing, Software Development, ug Applied Artificial Intelligence.\n• **Papel sa DASIG:** Naggunit sa teknikal nga imprastraktura sa portal ug nangulo sa inter-HEI technology transfer sa Central Visayas.\n• **Website:** [cit.edu](https://cit.edu) · **Location:** N. Bacalso Ave, Cebu City.`;
    } else if (lang === 'tagalog') {
      return `🏛️ **Cebu Institute of Technology – University (CIT-U):**\n\nAng **CIT-University** ay isang nangungunang autonomous private university sa Cebu City na siyang **Central Host Node** ng DASIG Regional Consortium.\n\n• **Kadalubhasaan:** Engineering, Computing, Software Development, at Applied Artificial Intelligence.\n• **Tungkulin sa DASIG:** Nagpapanatili ng teknikal na imprastraktura ng portal at nangunguna sa inter-HEI technology transfer sa Central Visayas.\n• **Website:** [cit.edu](https://cit.edu) · **Lokasyon:** N. Bacalso Ave, Cebu City.`;
    } else {
      return `🏛️ **Cebu Institute of Technology – University (CIT-U):**\n\n**CIT-University** is a premier autonomous higher education institution in Cebu City and the **Central Host Node** of the DASIG Consortium.\n\n• **Core Strengths:** Engineering, Computer Science, IT, and Applied Artificial Intelligence.\n• **Consortium Role:** Manages the central digital portal infrastructure and spearheads regional software and technology innovation across Region VII.\n• **Website:** [cit.edu](https://cit.edu) · **Location:** N. Bacalso Ave, Cebu City.`;
    }
  }

  // 2. Questions about UP Visayas (UPV)
  if (q.includes('upv') || q.includes('up visayas') || q.includes('university of the philippines visayas')) {
    if (lang === 'bisaya') {
      return `🌊 **University of the Philippines Visayas (UPV):**\n\nAng UPV maoy nag-unang nasudnong unibersidad sa Western Visayas (Miagao & Iloilo City) nga eksperto sa **Marine Science, Fisheries, ug Environmental Governance**.\n\n• **Amot sa DASIG:** Nangulo sa panukiduki sa kadagatan, climate resilience, ug aquatic biodiversity sa Kabisay-an.`;
    } else if (lang === 'tagalog') {
      return `🌊 **University of the Philippines Visayas (UPV):**\n\nAng UPV ang pangunahing pambansang pamantasan sa Western Visayas na nangunguna sa **Marine Science, Fisheries, at Environmental Governance**.\n\n• **Ambag sa DASIG:** Nangunguna sa pananaliksik sa karagatan, climate resilience, at aquatic biodiversity sa Kabisayaan.`;
    } else {
      return `🌊 **University of the Philippines Visayas (UPV):**\n\nUPV is a premier national research university in Western Visayas (Miagao & Iloilo City) specializing in **Marine Science, Fisheries, and Coastal Resource Management**.\n\n• **Consortium Role:** Leads marine and environmental research initiatives, climate adaptation frameworks, and biodiversity protection across Visayas.`;
    }
  }

  // 3. Questions about DOST / Grants / Research Funding Strategy
  if (q.includes('dost') || q.includes('proposal') || q.includes('grant') || q.includes('research funding') || q.includes('pondo')) {
    if (lang === 'bisaya') {
      return `💰 **DOST-7 Research Grants & Funding Framework:**\n\nAng Department of Science and Technology (DOST Region VII) naghatag og pondo alang sa mga akademiko ug mga tigdukiduki pinaagi sa:\n\n1. **GIA (Grants-In-Aid):** Pinansyal nga suporta alang sa mga research projects nga makatabang sa komunidad ug industriya.\n2. **SETUP Program:** Tabang pinansyal alang sa technological upgrading sa mga MSME.\n3. **Balik Scientist Program:** Pagpauli sa mga eksperto gikan sa gawas sa nasod.\n\n👉 *Aron mag-apply, tan-awa ang bukas nga mga tawag sa [Funding Module](/funding)!*`;
    } else if (lang === 'tagalog') {
      return `💰 **DOST-7 Research Grants & Funding Framework:**\n\nAng Department of Science and Technology (DOST Region VII) ay nagbibigay ng pondo para sa mga mananaliksik sa pamamagitan ng:\n\n1. **GIA (Grants-In-Aid):** Pinansyal na tulong para sa mga research projects na kapaki-pakinabang sa bansa.\n2. **SETUP Program:** Pagpapalakas ng teknolohiya para sa mga lokal na negosyo at MSME.\n3. **Balik Scientist Program:** Pakikipagtulungan sa mga dalubhasang siyentipiko.\n\n👉 *Maaari mong suriin ang mga aktibong pondo sa [Funding Module](/funding)!*`;
    } else {
      return `💰 **DOST-7 Research Grants & Funding Framework:**\n\nDOST Region VII provides robust financial and technical grant mechanisms for academic researchers:\n\n1. **Grants-In-Aid (GIA):** Direct funding for high-impact R&D projects aligning with regional and national development goals.\n2. **SETUP Program:** Tech upgrading and enterprise innovation assistance.\n3. **Consortium Collaborative Grants:** Joint inter-HEI research grants with partner universities.\n\n👉 *Track open grant calls and eligibility criteria in the [Funding Module](/funding)!*`;
    }
  }

  // 4. Questions about Regional Collaboration / Why Join DASIG / Mission
  if (q.includes('why') || q.includes('benefit') || q.includes('advantage') || q.includes('purpose') || q.includes('ngano') || q.includes('bakit')) {
    if (lang === 'bisaya') {
      return `🎯 **Nganong Mahinungdanon ang DASIG Consortium:**\n\nAng DASIG nagsumpay sa mga unibersidad, ahensya sa gobyerno, ug industriya aron:\n\n1. **Pagpaambit sa Kahibalo:** Pagbayloay sa mga pasilidad sa laboratoryo, digital resources, ug faculty expertise.\n2. **Dako nga Research Impact:** Hiniusang pag-apply sa mga multi-million research grants.\n3. **Standardized Accreditation:** Pagsiguro nga ang mga training bootcamps ug certificates giila sa tibook nasod.\n4. **Public Policy Innovation:** Paghimo og mga polisiya nga nakabase sa siyentipikong ebidensya.`;
    } else if (lang === 'tagalog') {
      return `🎯 **Bakit Mahalaga ang DASIG Consortium:**\n\nPinag-uugnay ng DASIG ang mga unibersidad, pamahalaan, at industriya upang:\n\n1. **Pagbabahagi ng Yaman:** Pagpapalitan ng laboratory facilities, digital resources, at kadalubhasaan ng faculty.\n2. **Malawak na Research Impact:** Magkasamang pag-aplay sa mga research grant at pondong pambansa.\n3. **Kinikilalang Pagsasanay:** Pagbibigay ng mga sertipikasyon na kinikilala sa buong rehiyon.\n4. **Inobasyon sa Pamamahala:** Paglikha ng mga patakarang nakabatay sa siyentipikong datos.`;
    } else {
      return `🎯 **Strategic Value of the DASIG Consortium:**\n\nDASIG addresses academic fragmentation by uniting universities, government agencies, and industry leaders:\n\n1. **Resource Optimization:** Shared laboratory facilities, high-performance computing, and research databases.\n2. **Competitive Grant Bidding:** Joint consortium proposals for DOST, CHED, and international funding.\n3. **Accredited Upskilling:** Standardized faculty bootcamps with cross-recognized micro-credentials.\n4. **Evidence-Based Governance:** Translating academic findings into actionable public policies.`;
    }
  }

  // 5. Questions about Certificates, Attendance, QR, and Accreditation
  if (q.includes('certificate') || q.includes('attendance') || q.includes('qr') || q.includes('sertipiko') || q.includes('patunay')) {
    if (lang === 'bisaya') {
      return `📜 **Sertipikasyon ug Attendance sa DASIG:**\n\n• **Pagparehistro:** Pag-enrol una sa event o training pinaagi sa Programs module.\n• **Attendance Tracking:** Ang administrator mag-scan o mag-verify sa imong pagtambong gamit ang live dashboard.\n• **Sertipiko:** Human makompleto ang gidugayon sa seminar o bootcamp, usa ka digital Certificate of Completion ang i-isyu ubos sa ngalan sa organizing agency (e.g. DICT, DOST, CIT-U).`;
    } else if (lang === 'tagalog') {
      return `📜 **Sertipikasyon at Attendance sa DASIG:**\n\n• **Pagpaparehistro:** Mag-enrol sa event o training sa pamamagitan ng Programs module.\n• **Attendance Tracking:** Ibe-beripika ng administrator ang iyong pagdalo gamit ang live dashboard.\n• **Sertipiko:** Pagkatapos ng programa, isang digital Certificate of Completion ang ipagkakaloob mula sa organizing agency (hal. DICT, DOST, CIT-U).`;
    } else {
      return `📜 **Certification & Attendance Verification:**\n\n• **Registration:** Reserve your slot via the Programs module.\n• **Live Verification:** Attendees are checked in real-time by administrators during the summit.\n• **Digital Certificates:** Upon completing the required hours, a certified Certificate of Completion is issued bearing the official seals of the host institution and organizing government agency.`;
    }
  }

  // 6. General Intelligent Reasoning Fallback
  if (lang === 'bisaya') {
    return `🧠 **Haribon AI Intelligence Response:**\n\nNakasabot ko sa imong gipangutana bahin sa **"${normalizedQuery}"**.\n\nIsip opisyal nga AI sa DASIG Regional Academic Consortium (Rehiyon VII), andam ko motabang kanimo:\n\n• 📅 **Events & Summits:** Pagpangita og eskedyul ug pagparehistro.\n• 🎓 **Faculty Development:** Pag-apil sa mga kurso sa AI, Research, ug Computing.\n• 💰 **Research Funding:** Pagsubay sa mga grants gikan sa DOST-7 ug CHED.\n• 👥 **Membership:** Pagsumite sa aplikasyon alang sa imong institusyon.\n\n💡 *Unsay piho nga bahin nga gusto nimong mahibaloan pa?*`;
  } else if (lang === 'tagalog') {
    return `🧠 **Haribon AI Intelligence Response:**\n\nNauunawaan ko ang iyong tanong tungkol sa **"${normalizedQuery}"**.\n\nBilang opisyal na AI ng DASIG Regional Academic Consortium (Rehiyon VII), narito ako upang magbigay ng gabay:\n\n• 📅 **Events & Summits:** Paghahanap ng iskedyul at pagpaparehistro.\n• 🎓 **Faculty Development:** Pagsali sa mga kurso sa AI, Research, at Computing.\n• 💰 **Research Funding:** Pagsubaybay sa mga grant mula sa DOST-7 at CHED.\n• 👥 **Membership:** Pagsusumite ng aplikasyon para sa iyong institusyon.\n\n💡 *May partikular ka bang aspeto na nais linawin o pag-usapan?*`;
  } else {
    return `🧠 **Haribon AI Intelligence Response:**\n\nI understand your inquiry regarding **"${normalizedQuery}"**.\n\nAs the intelligent assistant for the DASIG Regional Academic Consortium (Region VII), I can provide direct insights on:\n\n• 📅 **Consortium Summits & Events:** Schedules, venue logistics, and real-time registration.\n• 🎓 **Technical Training Bootcamps:** AI Engineering, STEM methods, and faculty certifications.\n• 💰 **Research Grants & Funding:** DOST-7 GIA, SETUP, and institutional grant calls.\n• 👥 **Institutional Membership:** Tier 1 / Tier 2 application procedures and charter benefits.\n\n💡 *What specific details would you like to explore further?*`;
  }
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

// GET /api/chatbot/intents
router.get('/intents', (req, res) => {
  res.json(KB.map(k => ({ intent: k.intent, sample: k.keywords[0] })));
});

module.exports = router;
