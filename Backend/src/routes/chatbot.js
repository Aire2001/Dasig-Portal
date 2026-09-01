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
    'unsa man', 'unsa diay', 'ayaw', 'ambot', 'tinuod', 'tinuod ba', 'pila bayad', 'libre ba', 'sulod'
  ];

  // Strong Tagalog / Filipino indicators
  const tagalogMarkers = [
    'ano', 'paano', 'sino', 'sino-sino', 'kailan', 'saan', 'nasaan', 'bakit', 'meron', 'mayroon',
    'wala', 'walang', 'magkano', 'paki', 'magandang', 'umaga', 'hapon', 'gabi', 'tanghali', 'araw',
    'sumali', 'pagsali', 'kasali', 'miyembro', 'tulong', 'tulungan', 'alam', 'turuan', 'kunin', 'bayad',
    'libre', 'kasama', 'gawin', 'gastos', 'pera', 'balita', 'dokumento', 'paaralan', 'unibersidad',
    'salamat', 'maraming salamat', 'po', 'opo', 'naman', 'kasi', 'talaga', 'pala', 'ngayon', 'mamaya',
    'nais', 'gusto ko', 'pwede ba', 'puwede', 'maaari', 'kailangan', 'saan banda', 'sino ang', 'ano ang',
    'ano ba', 'huwag', 'ewan', 'totoo ba', 'magkano bayad', 'libre ba', 'paano ba', 'pasok'
  ];

  let bScore = 0;
  let tScore = 0;

  const words = t.split(/[^a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ-]+/).filter(Boolean);
  for (const w of words) {
    if (bisayaMarkers.includes(w)) bScore += 1.5;
    if (tagalogMarkers.includes(w)) tScore += 1.5;
  }

  // Regex multi-word boosts
  if (/\b(unsa(ng|on|y)?|kinsa(y)?|kanus-?a|maayong (buntag|hapon|gabii|adlaw)|daghang salamat|naa(y)?|walay)\b/i.test(t)) {
    bScore += 4;
  }
  if (/\b(paano|ano (ang|ba)|sino (ang|ba)|kailan|magandang (umaga|hapon|gabi|araw)|maraming salamat|meron bang|mayroon bang|po|opo)\b/i.test(t)) {
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
      // Bisaya
      'maayong buntag', 'maayong hapon', 'maayong gabii', 'maayong adlaw', 'kumusta', 'kamusta', 'musta', 'halo', 'hoy', 'maayo',
      // Tagalog
      'magandang umaga', 'magandang hapon', 'magandang gabi', 'magandang araw', 'kumusta po', 'kamusta po', 'musta po'
    ],
    reply_en: 'Hello! Welcome to the DASIG Portal. I can help you with events, faculty training, membership, policies, funding grants, and partnerships. What would you like to know?',
    reply_ceb: 'Maayong adlaw! Welcome sa DASIG Portal. Andam ko motabang kanimo bahin sa mga events, faculty training, membership, polisiya, funding grants, ug mga partnerships. Unsay gusto nimong mahibaloan?',
    reply_tgl: 'Magandang araw! Maligayang pagdating sa DASIG Portal. Handa akong tumulong tungkol sa mga events, training para sa guro, membership, patakaran, funding grants, at partnerships. Ano po ang maipaglilingkod ko?',
  },
  {
    intent: 'thanks',
    keywords: [
      'thank you', 'thanks', 'thank you very much', 'many thanks', 'appreciate it', 'thx', 'ty',
      // Bisaya
      'salamat', 'daghang salamat', 'salamat kaayo', 'daghan salamat', 'sige salamat', 'salamat sa tabang', 'salamat kaau',
      // Tagalog
      'maraming salamat', 'maraming salamat po', 'salamat po', 'salamat nang marami', 'sige salamat po'
    ],
    reply_en: "You're very welcome! Feel free to ask if you have any more questions about the DASIG Consortium. Have a great day!",
    reply_ceb: "Walay sapayan! Ayaw pagduha-duha og pangutana kon duna pa kay mga klarohonon bahin sa DASIG Consortium. Maayong adlaw!",
    reply_tgl: "Walang anuman po! Huwag mag-atubiling magtanong muli kung mayroon ka pang katanungan tungkol sa DASIG Consortium. Magandang araw!",
  },
  {
    intent: 'about_dasig',
    keywords: [
      'what is dasig', 'about dasig', 'dasig consortium', 'who is dasig', 'what does dasig do', 'dasig mission', 'dasig vision',
      // Bisaya
      'unsa ang dasig', 'unsa man ang dasig', 'mahitungod sa dasig', 'unsay dasig', 'unsa ning dasig', 'unsay buhaton sa dasig', 'misyon sa dasig', 'bisyon sa dasig',
      // Tagalog
      'ano ang dasig', 'tungkol sa dasig', 'ano po ang dasig', 'ano ang ginagawa ng dasig', 'ano ang misyon ng dasig', 'ano ang layunin ng dasig'
    ],
    reply_en: '🏛️ **About DASIG:**\nDASIG (Dynamic Academic and Scientific Information Group) is a Region VII consortium of premier higher education institutions and regional government agencies in Central Visayas dedicated to collaborative research, governance innovation, and knowledge sharing.',
    reply_ceb: '🏛️ **Mahitungod sa DASIG:**\nAng DASIG (Dynamic Academic and Scientific Information Group) usa ka konsorsyum sa Rehiyon VII nga naghiusa sa mga nangaging unibersidad ug mga ahensya sa gobyerno sa Central Visayas aron magtinabangay sa panukiduki (research), inobasyon sa pamunoan, ug pagpaambit sa kahibalo.',
    reply_tgl: '🏛️ **Tungkol sa DASIG:**\nAng DASIG (Dynamic Academic and Scientific Information Group) ay isang konsorsyum sa Rehiyon VII na nag-uugnay sa mga nangungunang unibersidad at ahensya ng gobyerno sa Central Visayas upang magsulong ng collaborative research, inobasyon sa pamamahala, at pagbabahagi ng kaalaman.',
  },
  {
    intent: 'member_institutions',
    keywords: [
      'member institutions', 'consortium members', 'who are members', 'list of members', 'partner institutions', 'all members',
      // Bisaya
      'kinsay mga miyembro', 'mga unibersidad nga miyembro', 'kinsay apil sa dasig', 'listahan sa mga miyembro', 'kinsay mga sakop',
      // Tagalog
      'sino-sino ang mga miyembro', 'mga kasaping paaralan', 'sino ang kasali sa dasig', 'talaan ng mga miyembro'
    ],
    reply_en: '🏛️ **DASIG Consortium Members:**\nThe consortium includes premier universities and government regional offices in Region VII:\n• **CIT-University** (Cebu City — Host & Engineering)\n• **UP Visayas** (Marine & Aquatic Sciences, Iloilo/Miagao)\n• **University of San Agustin** (Governance & Ethics, Iloilo)\n• **DOST Region VII** (Science & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Trade & MSME Leadership)\n• **DepEd Region VII** (Basic Education & EdTech)',
    reply_ceb: '🏛️ **Mga Miyembro sa DASIG Consortium:**\nAng konsorsyum gilangkoban sa mga unibersidad ug mga ahensya sa gobyerno sa Rehiyon VII:\n• **CIT-University** (Cebu City — Host & Engineering Lead)\n• **UP Visayas** (Marine & Aquatic Sciences, Iloilo/Miagao)\n• **University of San Agustin** (Governance & Ethics, Iloilo)\n• **DOST Region VII** (Siyensya & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Patigayon & MSME Leadership)\n• **DepEd Region VII** (Edukasyon & EdTech)',
    reply_tgl: '🏛️ **Mga Miyembro ng DASIG Consortium:**\nKabilang sa konsorsyum ang mga sumusunod na institusyon sa Rehiyon VII:\n• **CIT-University** (Cebu City — Host & Engineering)\n• **UP Visayas** (Marine & Aquatic Sciences, Iloilo/Miagao)\n• **University of San Agustin** (Governance & Ethics, Iloilo)\n• **DOST Region VII** (Agham & Research Grants)\n• **DICT Region VII** (Digital Transformation & ICT Bootcamps)\n• **DTI Region VII** (Kalakalan & MSME Leadership)\n• **DepEd Region VII** (Edukasyon & EdTech)',
  },
  {
    intent: 'dost_info',
    keywords: [
      'dost', 'dost 7', 'dost region 7', 'dost vii', 'department of science and technology', 'science agency',
      // Bisaya
      'unsay dost', 'unsa ang dost', 'papel sa dost',
      // Tagalog
      'ano ang dost', 'papel ng dost'
    ],
    reply_en: '🔬 **Department of Science & Technology (DOST Region VII):**\nDOST is the lead government science agency in Central Visayas. Within DASIG, DOST provides research funding, facilitates the SETUP MSME program, coordinates SEI scholarships, and co-organizes STEM research symposiums.',
    reply_ceb: '🔬 **Department of Science & Technology (DOST Region VII):**\nAng DOST mao ang nag-unang ahensya sa siyensya sa Central Visayas. Sa DASIG, ang DOST naghatag og pondo sa panukiduki (research grants), nagdumala sa SETUP program, ug nag-coordinate sa SEI scholarships.',
    reply_tgl: '🔬 **Department of Science & Technology (DOST Region VII):**\nAng DOST ang nangungunang ahensya para sa agham sa Central Visayas. Sa DASIG, nagbibigay ang DOST ng research funding, nangangasiwa sa SETUP program, at nagpapatakbo ng SEI scholarships.',
  },
  {
    intent: 'dict_info',
    keywords: [
      'dict', 'dict 7', 'dict region 7', 'dict vii', 'department of information and communications', 'ict agency',
      // Bisaya
      'unsay dict', 'unsa ang dict', 'papel sa dict',
      // Tagalog
      'ano ang dict', 'papel ng dict'
    ],
    reply_en: '💻 **Department of Information & Communications Technology (DICT Region VII):**\nDICT leads digital transformation across Central Visayas. In DASIG, DICT conducts hands-on technical capacity bootcamps, manages e-governance infrastructure, and co-hosts regional cybersecurity forums.',
    reply_ceb: '💻 **Department of Information & Communications Technology (DICT Region VII):**\nAng DICT ang nangulo sa digital transformation sa Central Visayas. Sa DASIG, ang DICT nagdumala og mga technical bootcamps (sama sa Web Development), cybersecurity forums, ug digital governance training.',
    reply_tgl: '💻 **Department of Information & Communications Technology (DICT Region VII):**\nAng DICT ang nangunguna sa digital transformation sa Central Visayas. Sa DASIG, nagpapatakbo ang DICT ng technical bootcamps, cybersecurity forums, at digital governance training.',
  },
  {
    intent: 'citu_info',
    keywords: [
      'citu', 'cit-u', 'cit university', 'cebu institute of technology', 'cit',
      // Bisaya
      'unsa ang cit', 'unsay citu', 'bahin sa citu',
      // Tagalog
      'ano ang cit', 'tungkol sa citu'
    ],
    reply_en: '🏛️ **Cebu Institute of Technology – University (CIT-U):**\nCIT-U is a premier technological institution in Cebu City and the development home of the DASIG Portal (Team 40, IT411/IT332 Capstone). CIT-U provides technological leadership and hosts regional ICT innovation forums.',
    reply_ceb: '🏛️ **Cebu Institute of Technology – University (CIT-U):**\nAng CIT-U usa ka premier technological university sa Cebu City ug ang pinuy-anan sa pag-develop sa DASIG Portal (Team 40, IT411/IT332 Capstone). Ang CIT-U naghatag og teknolohikal nga liderato ug nag-host sa ICT Innovation Forum.',
    reply_tgl: '🏛️ **Cebu Institute of Technology – University (CIT-U):**\nAng CIT-U ay isang nangungunang pamantasan sa Cebu City at ang nag-develop ng DASIG Portal (Team 40, IT411/IT332 Capstone). Nagbibigay ang CIT-U ng teknolohikal na pamumuno at nagho-host ng mga ICT forum.',
  },
  {
    intent: 'events',
    keywords: [
      'event', 'events', 'summit', 'conference', 'seminar', 'workshop', 'calendar schedule', 'upcoming events',
      // Bisaya
      'unsay mga event', 'unsay kalihokan', 'naay event', 'mga umaabot nga event', 'kanus-a ang summit', 'unsay seminar', 'mga kalihukan',
      // Tagalog
      'anong mga event', 'anong kaganapan', 'may event ba', 'mga paparating na kaganapan', 'kailan ang summit', 'anong seminar', 'mga pagtitipon'
    ],
    reply_en: '📅 **Consortium Events & Summits:**\nDASIG regularly organizes research conferences, summits, and workshops across Central Visayas member institutions. You can view schedules, agendas, and register directly in the Programs module.',
    reply_ceb: '📅 **Mga Kalihokan ug Summit sa Konsorsyum:**\nAng DASIG kanunay nagpahigayon og mga komperensya sa panukiduki, summits, ug workshops sa Rehiyon VII. Mahimo nimong tan-awon ang eskedyul ug magparehistro direkta sa Programs module.',
    reply_tgl: '📅 **Mga Kaganapan at Summit ng Konsorsyum:**\nRegular na nagdaraos ang DASIG ng mga kumperensya sa pananaliksik, summit, at workshop sa Rehiyon VII. Maaari mong tingnan ang iskedyul at magparehistro nang direkta sa Programs module.',
  },
  {
    intent: 'event_register',
    keywords: [
      'register event', 'sign up event', 'join event', 'attend event', 'how to register', 'event registration',
      // Bisaya
      'unsaon pag-apil sa event', 'unsaon pag-rehistro', 'gusto ko moapil sa event', 'unsaon pagsalmot', 'pwede ba moapil',
      // Tagalog
      'paano magparehistro sa event', 'paano sumali sa event', 'gusto kong sumali sa event', 'paano mag-register', 'puwede ba sumali'
    ],
    reply_en: '📝 **How to Register for an Event:**\n1. Log in to your DASIG account.\n2. Navigate to **Programs > Events**.\n3. Choose your desired event and click **"Register"**.\n4. Complete the attendee details and submit. Slots are limited, so early registration is encouraged!',
    reply_ceb: '📝 **Unsaon Pag-rehistro sa Event:**\n1. Pag-log in sa imong DASIG account.\n2. Adto sa **Programs > Events**.\n3. Pilia ang event nga gusto nimong apilan ug i-click ang **"Register"**.\n4. Isulod ang imong detalye ug i-submit. Limitado ang mga slots, busa pagparehistro og sayo!',
    reply_tgl: '📝 **Paano Magparehistro sa Event:**\n1. Mag-log in sa iyong DASIG account.\n2. Pumunta sa **Programs > Events**.\n3. Piliin ang nais mong salihang event at i-click ang **"Register"**.\n4. Punan ang iyong mga detalye at i-submit. Limitado ang puwesto kaya magparehistro nang maaga!',
  },
  {
    intent: 'training',
    keywords: [
      'training', 'training programs', 'courses', 'bootcamp', 'upskill', 'capacity building',
      // Bisaya
      'unsay mga training', 'mga kurso', 'training para sa teachers', 'training para sa faculty', 'naay bootcamp', 'unsaon pag-enroll sa training',
      // Tagalog
      'anong mga training', 'mga kurso', 'pagsasanay para sa mga guro', 'pagsasanay sa faculty', 'may bootcamp ba', 'paano mag-enroll sa training'
    ],
    reply_en: '🎓 **Faculty Development & Training Programs:**\nDASIG offers specialized training courses in AI, Full-Stack Web Development, STEM Research Methods, and Public Governance. Browse programs and enroll directly in the Programs module!',
    reply_ceb: '🎓 **Mga Training ug Kurso sa DASIG:**\nNagtanyag ang DASIG og mga training sa AI, Web Development, STEM Research Methods, ug Public Governance. Mahimo kang motan-aw sa mga programa ug mag-enroll sa Programs module!',
    reply_tgl: '🎓 **Mga Pagsasanay at Kurso sa DASIG:**\nNag-aalok ang DASIG ng mga pagsasanay sa AI, Web Development, STEM Research Methods, at Public Governance. Maaari kang mag-browse at mag-enroll sa Programs module!',
  },
  {
    intent: 'certificate',
    keywords: [
      'certificate', 'certification', 'training certificate', 'completion certificate', 'proof of training',
      // Bisaya
      'naay certificate', 'makadawat bag certificate', 'unsaon pagkuha og certificate', 'katibayan sa training',
      // Tagalog
      'may certificate ba', 'makakakuha ba ng certificate', 'paano kumuha ng certificate', 'katibayan ng pagsasanay'
    ],
    reply_en: '📜 **Training Certificates:**\nYes! Verified Certificates of Participation and Completion are issued upon successfully completing the training program requirements by organizing agencies (DICT, DOST, DTI, DepEd).',
    reply_ceb: '📜 **Sertipiko sa Training:**\nOo! Makadawat ka og opisyal nga Certificate of Participation o Completion human nimo makompleto ang mga kinahanglanon sa training gikan sa nag-organisar nga ahensya (DICT, DOST, DTI, DepEd).',
    reply_tgl: '📜 **Sertipiko ng Pagsasanay:**\nOpo! Makatatanggap ka ng opisyal na Certificate of Participation o Completion kapag natapos mo ang mga kahingian sa training mula sa nag-organisang ahensya (DICT, DOST, DTI, DepEd).',
  },
  {
    intent: 'funding',
    keywords: [
      'funding', 'grants', 'scholarships', 'research grants', 'dost funding', 'budget', 'financial support',
      // Bisaya
      'naay funding', 'naay grants', 'kwarta para sa research', 'pondo sa research', 'scholarship', 'tabang pinansyal',
      // Tagalog
      'may funding ba', 'may grants ba', 'pondo para sa research', 'pondo sa pananaliksik', 'scholarship', 'tulong pinansyal'
    ],
    reply_en: '💰 **Research Grants & Funding Opportunities:**\nDASIG tracks active grant calls from DOST, international research funds, and institutional consortium grants. Filter by status (Open/Closed) and budget limits in the **Funding** module.',
    reply_ceb: '💰 **Mga Pondo ug Grants sa Panukiduki (Funding):**\nAng DASIG naglista og mga bukas nga research grants gikan sa DOST, internasyonal nga mga ahensya, ug pondo sa konsorsyum. Tan-awa ang mga kwalipikasyon sa **Funding** module.',
    reply_tgl: '💰 **Mga Pondo at Grants sa Pananaliksik (Funding):**\nNaglilista ang DASIG ng mga bukas na research grants mula sa DOST, pandaigdigang ahensya, at pondo ng konsorsyum. Tingnan ang mga detalye at kwalipikasyon sa **Funding** module.',
  },
  {
    intent: 'policy',
    keywords: [
      'policy', 'policies', 'guidelines', 'rules', 'governance policy', 'bylaws', 'ip policy',
      // Bisaya
      'unsay mga polisiya', 'mga balaod sa research', 'polisiya sa konsorsyum', 'patakaran',
      // Tagalog
      'ano ang mga patakaran', 'mga polisiya sa research', 'polisiya ng konsorsyum', 'alituntunin'
    ],
    reply_en: '📋 **Governance Policies & Guidelines:**\nAccess official consortium documents regarding Intellectual Property (IP), Research Ethics, Data Sharing, and Consortium Charters in the **Policies** module.',
    reply_ceb: '📋 **Mga Polisiya ug Lagda sa Pamunoan (Policies):**\nMakita nimo ang mga opisyal nga dokumento bahin sa Intellectual Property (IP), Research Ethics, Data Sharing, ug Charter sa **Policies** module.',
    reply_tgl: '📋 **Mga Patakaran at Alituntunin (Policies):**\nMakikita mo ang mga opisyal na dokumento tungkol sa Intellectual Property (IP), Research Ethics, Data Sharing, at Charter sa **Policies** module.',
  },
  {
    intent: 'partnerships',
    keywords: [
      'partnership', 'partnerships', 'partner', 'mou', 'moa', 'collaborations', 'alliances',
      // Bisaya
      'kinsay mga partner', 'mga kauban sa dasig', 'mou sa dasig', 'kasabutan',
      // Tagalog
      'sino ang mga partner', 'mga katuwang ng dasig', 'mou ng dasig', 'kasunduan'
    ],
    reply_en: '🤝 **Strategic Partnerships:**\nDASIG maintains bilateral agreements with government agencies (CHED, DOST, DICT), international universities, and industry partners. Explore all active alliances in the **Partnerships** module.',
    reply_ceb: '🤝 **Mga Estratehikong Kasosyo (Partnerships):**\nAng DASIG dunay mga kasabutan tali sa mga ahensya sa gobyerno (CHED, DOST, DICT), unibersidad, ug mga industriya. Tan-awa ang tanang aktibong alyansa sa **Partnerships** module.',
    reply_tgl: '🤝 **Mga Estratehikong Katuwang (Partnerships):**\nMay mga kasunduan ang DASIG sa mga ahensya ng pamahalaan (CHED, DOST, DICT), unibersidad, at mga industriya. Tingnan ang lahat ng aktibong alyansa sa **Partnerships** module.',
  },
  {
    intent: 'membership',
    keywords: [
      'membership', 'become member', 'apply member', 'join dasig', 'membership application', 'how to join',
      // Bisaya
      'unsaon pag-apil sa dasig', 'unsaon pagkahimong miyembro', 'gusto ko mahimong member', 'pagsali sa dasig', 'pila bayad sa membership',
      // Tagalog
      'paano sumali sa dasig', 'paano maging miyembro', 'gusto kong maging member', 'pagsali sa dasig', 'magkano ang membership'
    ],
    reply_en: '👥 **How to Join DASIG:**\nTo apply for institutional or individual membership:\n1. Log in and go to the **Membership** module.\n2. Click **"Apply for Membership"**.\n3. Fill in your institution details, select Tier 1 (Full) or Tier 2 (Associate), and submit for admin approval.',
    reply_ceb: '👥 **Unsaon Pag-apil sa DASIG:**\nPara sa aplikasyon sa membership:\n1. Pag-log in ug adto sa **Membership** module.\n2. I-click ang **"Apply for Membership"**.\n3. Isulod ang detalye sa imong unibersidad o ahensya, pilia ang Tier 1 o Tier 2, ug i-submit para sa pag-apruba sa admin.',
    reply_tgl: '👥 **Paano Sumali sa DASIG:**\nPara sa aplikasyon sa membership:\n1. Mag-log in at pumunta sa **Membership** module.\n2. I-click ang **"Apply for Membership"**.\n3. Punan ang mga detalye ng iyong paaralan/ahensya, piliin ang Tier 1 o Tier 2, at i-submit para sa pag-apruba ng admin.',
  },
  {
    intent: 'login',
    keywords: [
      'login', 'sign in', 'log in', 'credentials', 'account access',
      // Bisaya
      'unsaon pagsulod', 'unsaon pag-login', 'sulod sa account',
      // Tagalog
      'paano pumasok', 'paano mag-login', 'mag-sign in'
    ],
    reply_en: '🔐 **Sign In Assistance:**\nEnter your registered email and password on the Login page. If you are affiliated with a member institution (e.g. `@cit.edu`, `@up.edu.ph`, `@dost.gov.ph`), your institutional badge will be automatically detected.',
    reply_ceb: '🔐 **Tabang sa Pag-Login:**\nIsulod ang imong rehistradong email ug password sa Login page. Kon ang imong email gikan sa miyembrong eskwelahan (sama sa `@cit.edu`, `@up.edu.ph`), awtomatikong makita ang imong institutional badge.',
    reply_tgl: '🔐 **Tulong sa Pag-Login:**\nIpasok ang iyong rehistradong email at password sa Login page. Kung ang iyong email ay mula sa miyembrong institusyon (tulad ng `@cit.edu`, `@up.edu.ph`), awtomatikong lalabas ang iyong institutional badge.',
  },
  {
    intent: 'forgot_password',
    keywords: [
      'forgot password', 'reset password', 'lost password', 'cannot login',
      // Bisaya
      'nakalimot ko sa password', 'unsaon pag-reset sa password', 'nawala akong password', 'dili ko kasulod',
      // Tagalog
      'nakalimutan ko ang password', 'paano mag-reset ng password', 'nawala ang password ko', 'hindi ako makapasok'
    ],
    reply_en: '🔑 **Password Reset:**\nClick **"Forgot password?"** on the Login page and enter your email address. You will receive instructions to reset and create a secure new password.',
    reply_ceb: '🔑 **Pag-reset sa Password:**\nI-click ang **"Forgot password?"** sa Login page ug isulod ang imong email. Makadawat ka og link o instruksyon aron makahimo og bag-ong password.',
    reply_tgl: '🔑 **Pag-reset ng Password:**\nI-click ang **"Forgot password?"** sa Login page at ilagay ang iyong email. Makatatanggap ka ng instruksyon para makagawa ng bagong password.',
  },
  {
    intent: 'haribon',
    keywords: [
      'haribon', 'who are you', 'what are you', 'ai assistant', 'chatbot', 'dasig ai',
      // Bisaya
      'kinsa ka', 'unsa ka', 'unsa imong ngalan', 'unsa imong mahimo',
      // Tagalog
      'sino ka', 'ano ka', 'ano ang pangalan mo', 'ano ang kaya mong gawin'
    ],
    reply_en: '🦅 **I am Haribon AI:**\nI am the intelligent virtual assistant of the DASIG Regional Academic Consortium. I understand and converse in **English**, **Bisaya (Cebuano)**, and **Tagalog (Filipino)** to help you navigate events, training, funding, and consortium governance.',
    reply_ceb: '🦅 **Ako si Haribon AI:**\nAko ang virtual assistant sa DASIG Regional Academic Consortium. Makasabot ug makatubag ko sa **English**, **Bisaya (Cebuano)**, ug **Tagalog (Filipino)** aron motabang kanimo sa mga events, training, grants, ug membership!',
    reply_tgl: '🦅 **Ako si Haribon AI:**\nAko ang virtual assistant ng DASIG Regional Academic Consortium. Nakakaintindi at nakasasagot ako sa **English**, **Bisaya (Cebuano)**, at **Tagalog (Filipino)** upang tulungan ka sa mga events, training, grants, at membership!',
  },
  {
    intent: 'contact',
    keywords: [
      'contact', 'help', 'support', 'email admin', 'reach out', 'contact admin',
      // Bisaya
      'unsaon pag-kontak', 'kontaka ang admin', 'pangayo og tabang', 'email sa admin',
      // Tagalog
      'paano makipag-ugnayan', 'kontakin ang admin', 'humingi ng tulong', 'email ng admin'
    ],
    reply_en: '📬 **Contact & Support:**\nYou can reach the DASIG Consortium Administration through the **Contact Admin** page or via email at **`admin@dasig.ph`**.',
    reply_ceb: '📬 **Kontak ug Suporta:**\nMahimo kang mokontak sa DASIG Consortium Administration pinaagi sa **Contact Admin** page o mag-email sa **`admin@dasig.ph`**.',
    reply_tgl: '📬 **Kontak at Suporta:**\nMaaari kang makipag-ugnayan sa DASIG Consortium Administration sa pamamagitan ng **Contact Admin** page o mag-email sa **`admin@dasig.ph`**.',
  },
];

// Levenshtein distance for fuzzy typo tolerance
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

// Scored NLP Intent Matcher with Multi-Lingual Regex + Specificity Weighting
function matchIntent(text) {
  const lower = text.toLowerCase().trim();
  let best = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (lower === kw) {
        score += 6; // Exact match bonus
      } else if (new RegExp(`\\b${escaped}\\b`, 'i').test(lower)) {
        const tokenCount = kw.split(/\s+/).length;
        score += 2.5 + (tokenCount * 1.0);
      } else if (lower.includes(kw) && kw.length >= 4) {
        score += 1.2;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0 ? { entry: best, score: bestScore } : null;
}

// Follow-up suggestions in 3 languages
const MULTI_FOLLOWUPS = {
  english: [
    '📅 What events are coming up?',
    '🎓 What training is available?',
    '👥 How do I become a member?',
    '💰 What funding opportunities exist?',
    '📋 What policies are available?',
    '🦅 Tell me about Haribon AI'
  ],
  bisaya: [
    '📅 Unsay mga umaabot nga events?',
    '🎓 Unsay mga training programs?',
    '👥 Unsaon pagkahimong miyembro?',
    '💰 Naay funding para sa research?',
    '🏛️ Kinsay mga miyembro sa DASIG?',
    '🦅 Kinsa ka Haribon?'
  ],
  tagalog: [
    '📅 Anong mga paparating na kaganapan?',
    '🎓 Anong mga training ang available?',
    '👥 Paano maging miyembro ng DASIG?',
    '💰 May research funding ba?',
    '🏛️ Sino-sino ang mga miyembrong unibersidad?',
    '🦅 Sino ka Haribon?'
  ]
};

// POST /api/chatbot/message
router.post('/message', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

  const trimmed = message.trim();
  // Strip emojis from chips before processing
  const normalized = trimmed.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s*/gu, '');
  
  // 1. Detect User's Language
  const lang = detectLanguage(normalized);

  // 2. High-Accuracy NLP Intent Scoring
  let matchedResult = matchIntent(normalized);
  let match = matchedResult ? matchedResult.entry : null;
  let bestScore = matchedResult ? matchedResult.score : 0;

  // 3. Typo-Tolerant Fuzzy Matching Fallback
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

  // 4. Log interaction telemetry (fire-and-forget)
  Promise.resolve(
    supabase.from('chatbot_logs').insert({
      message: normalized,
      matched: !!match,
      intent: match ? match.intent : null,
    })
  ).catch(err => console.warn('[chatbot] Log error:', err.message));

  // 5. If No Match Found — Deliver Polite Multilingual Guidance
  if (!match) {
    const unmatchedFallbacks = {
      english: "I couldn't find a specific answer for that. Try rephrasing your question or pick a topic below — I'm happy to help!",
      bisaya: "Pasayloa ko, wala ko nakakita og eksaktong tubag para ana. Pwede nimo usbon ang imong pangutana o mopili sa mga topiko sa ubos — andam ko motabang!",
      tagalog: "Paumanhin, hindi ko nahanap ang tiyak na sagot para diyan. Maaari mong baguhin ang iyong tanong o pumili sa mga paksa sa ibaba — handa akong tumulong!"
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

  // 6. Select Appropriate Language Reply
  let reply = match.reply_en;
  if (lang === 'bisaya' && match.reply_ceb) reply = match.reply_ceb;
  if (lang === 'tagalog' && match.reply_tgl) reply = match.reply_tgl;

  // 7. Dynamic Real-Time Supabase Database Enrichment
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

  // 8. Navigation Target Mapping
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
