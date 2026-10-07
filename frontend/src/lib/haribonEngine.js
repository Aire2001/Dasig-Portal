// 🦅 Haribon AI — High-IQ Trilingual Knowledge Base & Cognitive Reasoning Engine
// Fluent in English, Bisaya (Cebuano), and Tagalog (Filipino).
// Operates standalone in client-side or backend environments.

export function detectLanguage(text) {
  if (!text) return 'english';
  const t = text.toLowerCase();

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

// Comprehensive Knowledge Base
export const HARIBON_KB = [
  {
    intent: 'about_dasig',
    keywords: [
      'what is dasig', 'about dasig', 'dasig consortium', 'who is dasig', 'what does dasig do',
      'dasig meaning', 'dasig acronym', 'dasig mission', 'dasig vision', 'tell me about dasig',
      'explain dasig', 'define dasig', 'what is this portal', 'what does this app do',
      'unsa ang dasig', 'unsay dasig', 'unsa man ang dasig', 'mahitungod sa dasig', 'unsa ning dasig',
      'ano ang dasig', 'tungkol sa dasig', 'ano po ang dasig', 'ano ang ginagawa ng dasig', 'ano ibig sabihin ng dasig'
    ],
    navigate_to: '/',
    followups: ['Who are the member institutions?', 'How do I join DASIG?', 'What events are coming up?'],
    reply_en: `🏛️ **What is DASIG?**

**DASIG** stands for **Dynamic Academic and Scientific Information Group**. It is the premier regional academic and scientific consortium in **Central Visayas (Region VII)**, Philippines.

### 🌐 The Regional Consortium Network:
The consortium unites **7 leading academic and government institutions**:
• **CIT-University** (Cebu City — Central Host Node & Computing Hub)
• **UP Visayas** (Marine & Aquatic Sciences, Miagao & Iloilo)
• **University of San Agustin** (Institutional Governance, Law & Ethics, Iloilo)
• **DOST Region VII** (Science, Technology & Research Grants-In-Aid)
• **DICT Region VII** (Digital Transformation & ICT Bootcamps)
• **DTI Region VII** (Regional Trade, MSME Commercialization & Tech Transfer)
• **DepEd Region VII** (Basic Education & Educational Technology)

### 🎯 Core Objectives:
1. **Collaborative Research:** Multi-HEI scientific research funded by DOST-7 Grants-In-Aid.
2. **Faculty Capability Building:** Certified technical bootcamps in AI, Cloud, and Software Engineering.
3. **Regional Digital Transformation:** Unifying events, policies, and research datasets across Central Visayas.

👉 *Explore active programs on the **[Homepage](/)** or apply in the **[Membership Portal](/membership)**!*`,

    reply_ceb: `🏛️ **Unsa ang DASIG?**

Ang **DASIG** nagpasabot og **Dynamic Academic and Scientific Information Group**. Kini ang nangunang rehiyonal nga konsorsyum sa mga unibersidad ug mga ahensya sa gobyerno dinhi sa **Central Visayas (Rehiyon VII)**.

### 🌐 Ang 7 ka Kasaping Institusyon:
• **CIT-University** (Cebu City — Central Host Node ug Engineering/IT Hub)
• **UP Visayas** (Marine & Aquatic Sciences)
• **University of San Agustin** (Governance & Ethics)
• **DOST Region VII** (Pondo sa Siyensya & Research Grants)
• **DICT Region VII** (Digital Transformation & Technical Bootcamps)
• **DTI Region VII** (Patigayon & MSME Commercialization)
• **DepEd Region VII** (Edukasyon & EdTech)

### 🎯 Katuyoan sa DASIG:
1. **Panukiduki (Research):** Pagtinabangay sa mga unibersidad sa mga dagkong research projects uban sa DOST-7.
2. **Faculty Development:** Paghatag og libreng sertipikadong training sa mga magtutudlo.
3. **Teknolohiya:** Paghimo og hiniusang digital portal para sa Central Visayas.

👉 *Tan-awa ang mga aktibidad sa **[Programs Module](/programs)** o pag-apil sa **[Membership](/membership)**!*`,

    reply_tgl: `🏛️ **Ano ang DASIG?**

Ang **DASIG** ay nangangahulugang **Dynamic Academic and Scientific Information Group**. Ito ang nangungunang rehiyonal na konsorsyum ng mga unibersidad at ahensya ng pamahalaan sa **Central Visayas (Rehiyon VII)**.

### 🌐 Ang 7 Kasaping Institusyon:
• **CIT-University** (Cebu City — Central Host Node at Engineering/IT Hub)
• **UP Visayas** (Marine & Aquatic Sciences)
• **University of San Agustin** (Governance & Ethics)
• **DOST Region VII** (Agham, Teknolohiya at Research Grants)
• **DICT Region VII** (Digital Transformation at Technical Bootcamps)
• **DTI Region VII** (Kalakalan at MSME Commercialization)
• **DepEd Region VII** (Edukasyon at EdTech)

### 🎯 Layunin ng DASIG:
1. **Collaborative Research:** Pagsasama ng mga unibersidad para sa malalaking pananaliksik katuwang ang DOST-7.
2. **Pagsasanay sa mga Guro:** Pagbibigay ng sertipikadong bootcamps sa AI, Cloud, at Information Technology.
3. **Regional Inobasyon:** Pagtataguyod ng iisang digital ecosystem para sa Central Visayas.

👉 *Tuklasin ang mga kaganapan sa **[Programs Module](/programs)** o mag-aplay sa **[Membership](/membership)**!*`
  },

  {
    intent: 'member_institutions',
    keywords: [
      'member institutions', 'consortium members', 'who are members', 'list of members', 'partner institutions',
      'all members', 'universities in dasig', 'cit-u', 'upv', 'san agustin', 'dost-7', 'dict-7', 'dti-7', 'deped-7',
      'kinsay mga miyembro', 'kinsay apil', 'mga unibersidad', 'sino ang mga miyembro', 'kasaping paaralan'
    ],
    navigate_to: '/members',
    followups: ['How do I join DASIG?', 'What events are coming up?', 'What funding is available?'],
    reply_en: `🏛️ **DASIG Consortium Member Institutions:**

The consortium comprises 7 premier higher education institutions and regional government agencies:

1. **CIT-University (Cebu City)** — *Central Host Node & Engineering Hub*
   Leads portal technical infrastructure, AI engineering, and inter-HEI technology transfer.
2. **UP Visayas (Miagao & Iloilo City)** — *Marine & Aquatic Research Node*
   Leads fisheries, coastal ecology, climate resilience, and environmental sciences.
3. **University of San Agustin (Iloilo City)** — *Institutional Governance Node*
   Leads academic ethics, pharmacy & health research, and institutional policy design.
4. **DOST Region VII** — *Science & Research Funding Agency*
   Provides Grants-In-Aid (GIA), research instrumentation, and laboratory access.
5. **DICT Region VII** — *Digital Transformation Agency*
   Delivers regional developer bootcamps, cybersecurity frameworks, and startup incubation.
6. **DTI Region VII** — *Trade & Enterprise Node*
   Facilitates intellectual property commercialization and regional MSME linkages.
7. **DepEd Region VII** — *Educational Leadership Node*
   Oversees basic education STEM pipelines and K-12 learning technology integration.

👉 *View detailed profiles and representatives in the **[Members Directory](/members)**!*`,

    reply_ceb: `🏛️ **Mga Miyembro sa DASIG Consortium:**

Adunay 7 ka nangunang unibersidad ug ahensya sa gobyerno sa atong network:

1. **CIT-University (Cebu City)** — Central Host Node, Engineering & Computer Science.
2. **UP Visayas** — Marine Science, Fisheries, ug Environmental Protection.
3. **University of San Agustin (Iloilo)** — Governance, Pharmacy, ug Research Ethics.
4. **DOST Region VII** — Grants-In-Aid ug pinansyal nga pondo sa panukiduki.
5. **DICT Region VII** — Digital Transformation, AI bootcamps, ug cybersecurity.
6. **DTI Region VII** — Patigayon ug pagpamaligya sa mga teknolohiya (commercialization).
7. **DepEd Region VII** — Basic education ug STEM pipelines.

👉 *Tan-awa ang tibuok listahan sa **[Members Module](/members)**!*`,

    reply_tgl: `🏛️ **Mga Kasaping Institusyon ng DASIG:**

Binubuo ito ng 7 nangungunang unibersidad at ahensya ng pamahalaan:

1. **CIT-University (Cebu City)** — Central Host Node, Engineering & Computer Science.
2. **UP Visayas** — Marine Science, Fisheries, at Environmental Protection.
3. **University of San Agustin (Iloilo)** — Governance, Pharmacy, at Research Ethics.
4. **DOST Region VII** — Grants-In-Aid at pondo para sa pananaliksik.
5. **DICT Region VII** — Digital Transformation, AI bootcamps, at cybersecurity.
6. **DTI Region VII** — Kalakalan at pagsasapamilihan ng teknolohiya (commercialization).
7. **DepEd Region VII** — Basic education at STEM pipelines.

👉 *Tingnan ang buong talaan sa **[Members Module](/members)**!*`
  },

  {
    intent: 'membership',
    keywords: [
      'membership', 'become member', 'apply member', 'join dasig', 'how to join', 'membership application',
      'membership tier', 'tier 1', 'tier 2', 'member vs guest', 'member benefits', 'digital id',
      'unsaon pag-apil', 'unsaon pagkahimong miyembro', 'paano sumali', 'paano maging miyembro', 'benepisyo'
    ],
    navigate_to: '/membership',
    followups: ['What are the member tiers?', 'Who are the members?', 'What events are coming up?'],
    reply_en: `👥 **How to Join the DASIG Consortium:**

### 📝 Step-by-Step Application Process:
1. **Create an Account:** Register with your verified institutional email.
2. **Access Membership Portal:** Go to **[Membership Module](/membership)** and click **"Apply for Membership"**.
3. **Select Membership Tier:**
   • **Tier 1 (Full Consortium Member):** For autonomous/accredited universities with voting rights on charters and principal DOST grant leadership.
   • **Tier 2 (Associate Member):** For emerging colleges, research centers, and government affiliates.
4. **Submit Affiliation Documents:** Provide institutional endorsement or faculty verification.
5. **Admin Review:** The governing committee reviews applications within 1–2 working days.

### 👑 Exclusive Member Privileges:
• ⚡ **Priority VIP Passes:** Reserved seats for regional summits even when public slots fill up.
• 📜 **Verified Digital Certificates:** Tamper-evident PDF credentials with SHA-256 verification hash.
• 🪪 **Digital Membership ID:** Interactive pass with institutional badge and QR verification.
• 🔬 **Research Grant Leadership:** Co-lead DOST-7 and DICT regional funding calls.

👉 *Apply now in the **[Membership Portal](/membership)**!*`,

    reply_ceb: `👥 **Unsaon Pag-apil sa DASIG Consortium:**

### 📝 Mga Lakang sa Pag-apply:
1. **Paghimo og Account:** Pag-sign up gamit ang imong institutional email.
2. **Ablihi ang Membership:** Adto sa **[Membership Module](/membership)** ug i-klik ang **"Apply for Membership"**.
3. **Pilia ang Tier:**
   • **Tier 1 (Full Member):** Para sa mga autonomous universities nga may katungod sa pagbotar sa mga polisiya.
   • **Tier 2 (Associate):** Para sa mga emerging colleges ug affiliated researchers.
4. **I-submit ang Detalye:** Isulod ang institutional endorsement form.
5. **Pag-apruba:** Susihon kini sa admin sulod sa 1–2 ka adlaw sa negosyo.

### 👑 Mga Bentaha sa Miyembro:
• ⚡ **Priority Seats:** May reserved VIP slots sa tanang events ug bootcamps.
• 📜 **Libreng Verified Certificate:** Automated PDF certificate nga may QR verification code.
• 🪪 **Digital ID:** Opisyal nga consortium badge sa imong profile.

👉 *Pag-apply na sa **[Membership Portal](/membership)**!*`,

    reply_tgl: `👥 **Paano Sumali sa DASIG Consortium:**

### 📝 Mga Hakbang sa Pag-aplay:
1. **Gumawa ng Account:** Mag-sign up gamit ang iyong institutional email.
2. **Buksan ang Membership:** Pumunta sa **[Membership Module](/membership)** at pindutin ang **"Apply for Membership"**.
3. **Piliin ang Tier:**
   • **Tier 1 (Full Member):** Para sa mga autonomous universities na may karapatang bumoto sa mga patakaran.
   • **Tier 2 (Associate):** Para sa mga kolehiyo at katuwang na mananaliksik.
4. **I-sumite ang Detalye:** I-upload ang institutional endorsement.
5. **Pag-apruba:** Rebyuhin ito ng admin sa loob ng 1–2 araw.

### 👑 Mga Pribilehiyo ng Miyembro:
• ⚡ **VIP Priority:** May nakalaang puwesto sa lahat ng summits at bootcamps.
• 📜 **Libreng Sertipiko:** Tamper-evident PDF certificate na may verification code.
• 🪪 **Digital ID:** Opisyal na digital membership card sa iyong profile.

👉 *Mag-aplay na sa **[Membership Portal](/membership)**!*`
  },

  {
    intent: 'events',
    keywords: [
      'event', 'events', 'summit', 'conference', 'seminar', 'workshop', 'calendar schedule', 'upcoming events',
      'september', 'october', 'symposium', 'schedule', 'register event', 'sign up event', 'how to register',
      'unsay mga event', 'mga kalihokan', 'kanus-a ang summit', 'anong mga event', 'kailan ang summit'
    ],
    navigate_to: '/programs?tab=events',
    followups: ['How do I register for an event?', 'What training programs are available?', 'What is DASIG?'],
    reply_en: `📅 **Consortium Events & Summits (2026 Schedule):**

Here are the active flagship summits organized across Region VII:

1. **Regional AI Research & Innovation Summit 2026**
   • 📅 **Date:** September 18, 2026
   • 📍 **Venue:** CIT-University Main Auditorium, Cebu City (Hybrid Live Stream)
   • 🎯 **Topic:** Applied GenAI in Higher Education & DOST Research Frameworks
   • 👥 **Capacity:** 500 Participants (Fast-filling)

2. **Inter-HEI Computing & Science Symposium**
   • 📅 **Date:** September 25, 2026
   • 📍 **Venue:** UP Visayas Conference Hall (Miagao / Zoom)
   • 🎯 **Topic:** Multi-Disciplinary Data Science & Marine Ecology

3. **Central Visayas EdTech Leadership Conference**
   • 📅 **Date:** October 12, 2026
   • 📍 **Venue:** University of San Agustin Grand Hall, Iloilo City
   • 🎯 **Topic:** Regional Governance, Academic IP & Ethics

### 🎟️ How to Register:
1. Navigate to **[Programs > Events](/programs?tab=events)**.
2. Select your event and click **"Register"**.
3. You will immediately receive a digital boarding pass with a **high-contrast QR check-in barcode**!

👉 *Reserve your seat now in the **[Programs Module](/programs?tab=events)**!*`,

    reply_ceb: `📅 **Mga Kalihokan ug Summit sa DASIG (2026):**

Mao kini ang mga umaabot nga dagkong kalihokan sa Rehiyon VII:

1. **Regional AI Research & Innovation Summit 2026**
   • 📅 **Petsa:** Setyembre 18, 2026 · 📍 **Lugar:** CIT-University Auditorium, Cebu City
   • 🎯 **Tema:** Artificial Intelligence ug Panukiduki sa Rehiyon VII
2. **Inter-HEI Computing & Science Symposium**
   • 📅 **Petsa:** Setyembre 25, 2026 · 📍 **Lugar:** UP Visayas
3. **EdTech Leadership Conference**
   • 📅 **Petsa:** Oktubre 12, 2026 · 📍 **Lugar:** Univ. of San Agustin

### 🎟️ Unsaon Pag-rehistro:
• Ablihi ang **[Programs Module](/programs?tab=events)**, pilia ang event, ug i-klik ang **"Register"**. Makadawat ka dayon og digital pass nga may QR code!`,

    reply_tgl: `📅 **Mga Kaganapan at Summit ng DASIG (2026):**

Narito ang mga pangunahing symposiums at pagtitipon sa Rehiyon VII:

1. **Regional AI Research & Innovation Summit 2026**
   • 📅 **Petsa:** Setyembre 18, 2026 · 📍 **Lokasyon:** CIT-University Auditorium, Cebu City
   • 🎯 **Paksa:** Artificial Intelligence at Pananaliksik sa Rehiyon VII
2. **Inter-HEI Computing & Science Symposium**
   • 📅 **Petsa:** Setyembre 25, 2026 · 📍 **Lokasyon:** UP Visayas
3. **EdTech Leadership Conference**
   • 📅 **Petsa:** Oktubre 12, 2026 · 📍 **Lokasyon:** Univ. of San Agustin

### 🎟️ Paano Magparehistro:
• Pumunta sa **[Programs Module](/programs?tab=events)**, piliin ang event, at i-click ang **"Register"**. Makatatanggap ka agad ng digital pass na may QR code!`
  },

  {
    intent: 'training',
    keywords: [
      'training', 'training programs', 'courses', 'bootcamp', 'upskill', 'capacity building',
      'faculty training', 'certificate', 'sertipiko', 'mga kurso', 'pagsasanay', 'genai bootcamp'
    ],
    navigate_to: '/programs?tab=training',
    followups: ['How do I get a certificate?', 'What events are coming up?', 'How to join DASIG?'],
    reply_en: `🎓 **Faculty Development & Technical Bootcamps:**

DASIG conducts high-impact accredited professional courses in collaboration with DICT, DOST, and CIT-U:

1. **Applied GenAI & LLM Engineering for Academia**
   • ⏱️ **Duration:** 4 Weeks (Intensive Hybrid) · 🏛️ **Organizer:** CIT-U & DICT-7
   • 💡 **Covers:** Prompt Engineering, RAG Architectures, Vector Databases & Local LLMs.
2. **STEM Empirical Research Methods & Data Analytics**
   • ⏱️ **Duration:** 2 Weeks · 🏛️ **Organizer:** UP Visayas & DOST-7
   • 💡 **Covers:** Statistical Modeling, ISO 25010 Quality Framework, and Peer-Reviewed Publishing.
3. **Cybersecurity & Institutional Data Privacy (RA 10173)**
   • ⏱️ **Duration:** 3 Weeks · 🏛️ **Organizer:** University of San Agustin
   • 💡 **Covers:** NPC RA 10173 Compliance, Threat Modeling, and Secure Cloud Pipelines.

### 📜 Digital Micro-Credentials:
Completing all course attendance check-ins unlocks an automated, tamper-evident **Certificate of Completion** downloadable directly from your Profile!

👉 *Enroll directly in the **[Training Module](/programs?tab=training)**!*`,

    reply_ceb: `🎓 **Mga Training ug Bootcamps sa DASIG:**

Nagtanyag ang konsorsyum og mga sertipikadong kurso kauban ang DICT, DOST, ug CIT-U:

1. **Applied GenAI & LLM Engineering:** 4 ka semana bahin sa Artificial Intelligence ug prompt engineering.
2. **STEM Research Methods & Analytics:** 2 ka semana bahin sa data analysis ug panukiduki kauban ang UP Visayas.
3. **Cybersecurity & Data Privacy (RA 10173):** 3 ka semana bahin sa proteksyon sa datos sa unibersidad.

Human sa kurso, makadawat ka og opisyal nga **Certificate of Completion** nga may QR code!

👉 *Mag-enrol sa **[Training Module](/programs?tab=training)**!*`,

    reply_tgl: `🎓 **Mga Pagsasanay at Bootcamps ng DASIG:**

Nag-aalok ang konsorsyum ng mga sertipikadong kurso katuwang ang DICT, DOST, at CIT-U:

1. **Applied GenAI & LLM Engineering:** 4 na linggo tungkol sa Artificial Intelligence at prompt engineering.
2. **STEM Research Methods & Analytics:** 2 linggo tungkol sa data analysis at pananaliksik kasama ang UP Visayas.
3. **Cybersecurity & Data Privacy (RA 10173):** 3 linggo tungkol sa proteksyon ng datos sa unibersidad.

Pagkatapos ng kurso, makatatanggap ka ng opisyal na **Certificate of Completion** na may QR code!

👉 *Mag-enrol sa **[Training Module](/programs?tab=training)**!*`
  },

  {
    intent: 'funding',
    keywords: [
      'funding', 'grants', 'scholarships', 'research grants', 'dost funding', 'budget', 'financial support',
      'pondo', 'kwarta para sa research', 'tulong pinansyal', 'gia', 'setup', 'open grants'
    ],
    navigate_to: '/funding',
    followups: ['What events are coming up?', 'How to apply for membership?', 'What training is available?'],
    reply_en: `💰 **Research Grants & Funding Opportunities:**

DASIG maintains real-time integration with regional research grant calls:

1. **DOST-7 Grants-In-Aid (GIA) Program**
   • 💵 **Budget Range:** ₱500,000 – ₱5,000,000
   • 🎯 **Priority Sectors:** Smart Agriculture, Applied AI, Renewable Energy & Public Health.
   • 🏛️ **Eligibility:** Consortium faculty researchers and inter-HEI joint proponent teams.

2. **Small Enterprise Technology Upgrading (SETUP)**
   • 💵 **Funding:** Tech acquisition & commercialization funding for university spin-offs.

3. **Consortium Multi-HEI Seed Innovation Fund**
   • 💵 **Budget:** ₱250,000 rapid prototyping grants for faculty & student capstone innovations.

👉 *Check open deadlines and submission criteria in the **[Funding Module](/funding)**!*`,

    reply_ceb: `💰 **Mga Pondo ug Grants sa Panukiduki (Funding):**

Naglista ang DASIG og mga bukas nga pondo gikan sa DOST-7 ug konsorsyum:
• **DOST-7 Grants-In-Aid (GIA):** ₱500,000 hangtod ₱5,000,000 alang sa dagkong research sa AI, agrikultura, ug panglawas.
• **SETUP Program:** Tabang sa teknolohiya para sa mga produkto sa unibersidad.
• **Seed Innovation Grants:** ₱250,000 alang sa prototyping sa capstone ug software projects.

👉 *Tan-awa ang mga requirements sa **[Funding Module](/funding)**!*`,

    reply_tgl: `💰 **Mga Pondo at Grants sa Pananaliksik (Funding):**

Naglilista ang DASIG ng mga bukas na pondo mula sa DOST-7 at konsorsyum:
• **DOST-7 Grants-In-Aid (GIA):** ₱500,000 hanggang ₱5,000,000 para sa malalaking pananaliksik sa AI, agrikultura, at kalusugan.
• **SETUP Program:** Tulong sa teknolohiya para sa mga produkto ng unibersidad.
• **Seed Innovation Grants:** ₱250,000 para sa prototyping ng capstone at software projects.

👉 *Tingnan ang mga kwalipikasyon sa **[Funding Module](/funding)**!*`
  },

  {
    intent: 'policies',
    keywords: [
      'policy', 'policies', 'governance', 'data privacy', 'ra 10173', 'charter', 'ip code', 'ethics',
      'patakaran', 'mga lagda', 'polisiya', 'privacy policy', 'rules', 'terms'
    ],
    navigate_to: '/policies',
    followups: ['What is DASIG?', 'How do I join?', 'What funding is available?'],
    reply_en: `📋 **Consortium Governance & Legal Policies:**

All DASIG operations adhere strictly to Philippine statutory frameworks and academic ethics:

1. **Data Privacy Act of 2012 (Republic Act 10173):**
   Full compliance with the National Privacy Commission (NPC). All attendee emails, digital IDs, and research datasets are encrypted with TLS 1.3 and stored with strict PostgreSQL Row-Level Security (RLS).
2. **Consortium Intellectual Property (IP) Sharing Accord:**
   Ensures researchers and originating HEIs retain full ownership of their patents and inventions developed under consortium grants.
3. **Open Science & Inter-HEI Data Governance Charter:**
   Governs ethical dataset exchange among partner universities (CIT-U, UPV, USA).

👉 *Download and inspect complete policy documents in the **[Policies Module](/policies)**!*`,

    reply_ceb: `📋 **Mga Polisiya ug Lagda sa DASIG:**

Ang tanang operasyon sa konsorsyum nagsunod sa balaod sa Pilipinas:
• **Data Privacy Act of 2012 (RA 10173):** Protektado ug naka-encrypt ang imong personal nga impormasyon subay sa National Privacy Commission.
• **Intellectual Property (IP) Agreement:** Ang mga unibersidad ug mananaliksik nagpabilin nga tag-iya sa ilang mga imbensyon ug research.
• **Open Science Charter:** Hapsay nga pagtinabangay sa datos tali sa CIT-U, UPV, ug USA.

👉 *Basaha ang mga dokumento sa **[Policies Module](/policies)**!*`,

    reply_tgl: `📋 **Mga Patakaran at Pamamahala ng DASIG:**

Sumusunod ang lahat ng operasyon sa mga batas ng Pilipinas:
• **Data Privacy Act of 2012 (RA 10173):** Protektado at naka-encrypt ang iyong personal na datos ayon sa National Privacy Commission.
• **Intellectual Property (IP) Accord:** Ang mananaliksik at unibersidad ang mananatiling may-ari ng kanilang mga imbensyon at pananaliksik.
• **Open Science Charter:** Maayos na pagbabahagi ng datos sa pagitan ng CIT-U, UPV, at USA.

👉 *Basahin ang mga buong patakaran sa **[Policies Module](/policies)**!*`
  },

  {
    intent: 'haribon',
    keywords: [
      'who are you', 'what are you', 'haribon', 'ai assistant', 'chatbot', 'gemini', 'chatgpt',
      'kinsa ka', 'unsa ka', 'sino ka', 'ano ka', 'what can you do', 'unsay imong mahimo'
    ],
    navigate_to: '/chatbot',
    followups: ['What is DASIG?', 'What events are coming up?', 'How to apply for membership?'],
    reply_en: `🦅 **I am Haribon AI — The DASIG Virtual Assistant:**

I am the high-IQ conversational intelligence for the **DASIG Regional Academic Consortium (Region VII)**.

### 🧠 Core Capabilities:
• **Trilingual Fluency:** I understand and communicate fluently in **English**, **Bisaya (Cebuano)**, and **Tagalog (Filipino)**.
• **Consortium Knowledge:** Instant authoritative answers regarding events, faculty bootcamps, DOST funding calls, membership tiers, and policies.
• **Academic & Technical Reasoning:** Ready to explain computer science concepts, React, Python, RDBMS architecture, mathematics, and research methodologies.

💡 *Ask me anything about the consortium or academic topics! Pwede kang mangutana sa Bisaya o Tagalog.*`,

    reply_ceb: `🦅 **Ako si Haribon AI:**

Ako ang virtual assistant ug conversational intelligence sa **DASIG Regional Consortium**.

• **Trilingual:** Makasabot ug makatubag ko sa **English**, **Bisaya (Cebuano)**, ug **Tagalog (Filipino)**.
• **Kahibalo sa Portal:** Makatubag ko bahin sa mga events, training, pondo sa DOST, membership, ug mga unibersidad sa Rehiyon VII.
• **Siyensya & Tech:** Andam motabang sa mga pangutana bahin sa programming, matematika, ug research.

Unsay gusto nimong hisgotan karon? 🚀`,

    reply_tgl: `🦅 **Ako si Haribon AI:**

Ako ang virtual assistant at conversational intelligence ng **DASIG Regional Consortium**.

• **Trilingual:** Nakauunawa at nakasasagot ako sa **English**, **Bisaya (Cebuano)**, at **Tagalog (Filipino)**.
• **Kaalaman sa Portal:** Handa akong sumagot tungkol sa mga events, training, pondo ng DOST, membership, at mga unibersidad sa Rehiyon VII.
• **Agham at Teknolohiya:** Handa ring tumulong sa mga katanungan tungkol sa programming, matematika, at pananaliksik.

Ano ang nais mong alamin ngayon? 🚀`
  },

  {
    intent: 'greetings',
    keywords: [
      'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings',
      'maayong buntag', 'maayong hapon', 'maayong gabii', 'kumusta', 'kamusta', 'musta',
      'magandang umaga', 'magandang hapon', 'magandang gabi', 'kumusta po', 'kamusta po'
    ],
    navigate_to: null,
    followups: ['What is DASIG?', 'What events are coming up?', 'How do I join?'],
    reply_en: `👋 **Hello! Welcome to the DASIG Consortium Portal.**

I am **Haribon AI** 🦅, your intelligent assistant. I am fluent in **English**, **Bisaya (Cebuano)**, and **Tagalog (Filipino)**.

How can I help you today? You can ask me about:
• 🏛️ **DASIG Consortium:** Our mission and 7 member institutions (CIT-U, UPV, USA).
• 📅 **Events & Summits:** Schedules and instant registration with QR passes.
• 🎓 **Faculty Development:** Certified training bootcamps.
• 💰 **Research Grants:** Open DOST-7 funding calls.
• 👥 **Membership:** Applying for institutional accreditation.`,

    reply_ceb: `👋 **Maayong adlaw! Malipayong pag-abot sa DASIG Portal.**

Ako si **Haribon AI** 🦅, ang imong virtual assistant. Makasulti ug makatabang ko sa **English**, **Bisaya**, o **Tagalog**.

Unsay akong ikatabang kanimo karon? Pwede kang mangutana bahin sa:
• 🏛️ **Unsa ang DASIG** ug ang mga miyembro niini
• 📅 **Mga umaabot nga events ug summits**
• 🎓 **Faculty training ug bootcamps**
• 💰 **Research grants gikan sa DOST-7**
• 👥 **Unsaon pag-apil sa membership**`,

    reply_tgl: `👋 **Magandang araw! Maligayang pagdating sa DASIG Portal.**

Ako si **Haribon AI** 🦅, ang iyong virtual assistant. Handa akong makipag-usap sa **English**, **Bisaya**, o **Tagalog**.

Ano ang maitutulong ko sa iyo ngayon? Maaari kang magtanong tungkol sa:
• 🏛️ **Ano ang DASIG** at ang mga kasaping institusyon nito
• 📅 **Mga paparating na event at summit**
• 🎓 **Faculty training at bootcamps**
• 💰 **Research grants mula sa DOST-7**
• 👥 **Paano maging miyembro**`
  },

  {
    intent: 'thanks',
    keywords: [
      'thank you', 'thanks', 'many thanks', 'salamat', 'daghang salamat', 'salamat kaayo',
      'maraming salamat', 'salamat po', 'maraming salamat po', 'ty', 'thx'
    ],
    navigate_to: null,
    followups: ['What events are coming up?', 'What is DASIG?', 'How do I join?'],
    reply_en: `You're very welcome! 🦅 Feel free to ask whenever you need guidance regarding DASIG events, bootcamps, or research grants. Have an inspiring and productive day! 🚀`,
    reply_ceb: `Walay sapayan! 🦅 Ayaw pagduha-duha og pangutana kon duna pa kay mga kinahanglanon bahin sa DASIG events, training, o pondo. Maayong adlaw kanimo! 🚀`,
    reply_tgl: `Walang anuman po! 🦅 Huwag mag-atubiling magtanong kung may kailangan ka pa tungkol sa DASIG events, training, o pondo. Magandang araw sa iyo! 🚀`
  }
];

// Helper: Solve Math & Scientific Arithmetic
function evaluateMathExpression(str) {
  const clean = str.replace(/^(?:calculate|solve|what is|compute|pila ang|ano ang)\s*/i, '').replace(/\?/g, '').trim();
  const m = clean.match(/^(\d+(?:\.\d+)?)\s*([\+\-\*\/xX\^%]|times|plus|minus|divided by)\s*(\d+(?:\.\d+)?)$/i);
  if (!m) return null;

  const n1 = parseFloat(m[1]);
  let op = m[2].toLowerCase();
  const n2 = parseFloat(m[3]);
  let res = 0;

  if (op === '+' || op === 'plus') res = n1 + n2;
  else if (op === '-' || op === 'minus') res = n1 - n2;
  else if (op === '*' || op === 'x' || op === 'times') res = n1 * n2;
  else if (op === '/' || op === 'divided by') res = n2 !== 0 ? (n1 / n2) : 'Undefined (Division by zero)';
  else if (op === '^') res = Math.pow(n1, n2);
  else if (op === '%') res = n1 % n2;

  return { n1, op, n2, result: res };
}

// Main High-IQ Query Solver
export function solveClientQuery(query, history = [], user = null) {
  if (!query || !query.trim()) {
    return {
      reply: 'Hello! How may I assist you today? Ask me anything about DASIG programs, membership, or research grants.',
      intent: 'empty',
      navigate_to: null,
      followups: ['What is DASIG?', 'What events are coming up?', 'How to apply for membership?'],
      suggestions: [],
      language: 'english'
    };
  }

  const raw = query.trim();
  const lang = detectLanguage(raw);
  const q = raw.toLowerCase();

  // 1. Math computation check
  const math = evaluateMathExpression(q);
  if (math) {
    let reply = '';
    if (lang === 'bisaya') {
      reply = `🔢 **Kalkulasyon / Math:**\n\nAng resulta sa **${math.n1} ${math.op} ${math.n2}** kay: **${math.result}** ✨`;
    } else if (lang === 'tagalog') {
      reply = `🔢 **Kalkulasyon / Math:**\n\nAng resulta ng **${math.n1} ${math.op} ${math.n2}** ay: **${math.result}** ✨`;
    } else {
      reply = `🔢 **Mathematical Calculation:**\n\nThe result of **${math.n1} ${math.op} ${math.n2}** is: **${math.result}** ✨`;
    }
    return {
      reply,
      intent: 'math',
      navigate_to: null,
      followups: ['What is DASIG?', 'What events are coming up?'],
      suggestions: [],
      language: lang
    };
  }

  // 2. High-Accuracy Match against Knowledge Base
  let bestEntry = null;
  let bestScore = 0;

  for (const entry of HARIBON_KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwLower = kw.toLowerCase();
      if (q === kwLower) {
        score += 10;
      } else if (q.includes(kwLower)) {
        score += 5;
      } else {
        const words = kwLower.split(/\s+/);
        const allWordsPresent = words.length > 1 && words.every(w => q.includes(w));
        if (allWordsPresent) score += 4;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 4) {
    let reply = bestEntry.reply_en;
    if (lang === 'bisaya' && bestEntry.reply_ceb) reply = bestEntry.reply_ceb;
    if (lang === 'tagalog' && bestEntry.reply_tgl) reply = bestEntry.reply_tgl;

    return {
      reply,
      intent: bestEntry.intent,
      navigate_to: bestEntry.navigate_to || null,
      followups: bestEntry.followups || ['What is DASIG?', 'What events are coming up?'],
      suggestions: [],
      language: lang
    };
  }

  // 3. Technical & Scientific Specific Topics
  if (q.includes('react') || q.includes('usestate') || q.includes('useeffect')) {
    return {
      reply: `💻 **React.js & Frontend Architecture:**\n\n**React** is a declarative component-based JavaScript library designed for dynamic web applications:\n\n• **useState:** Manages reactive component state (\`const [val, setVal] = useState(0);\`).\n• **useEffect:** Executes side-effects like API data fetching and subscriptions.\n• **Virtual DOM:** Reconciles differences to ensure 60fps rendering speeds.`,
      intent: 'tech_react',
      navigate_to: null,
      followups: ['What training bootcamps are open?', 'What is DASIG?'],
      suggestions: [],
      language: lang
    };
  }

  if (q.includes('python')) {
    return {
      reply: `🐍 **Python Programming & Data Science:**\n\n**Python** is the leading language for scientific research, artificial intelligence, and rapid backend APIs. Within the DASIG consortium, Python is heavily taught across faculty bootcamps for PyTorch, NumPy, Pandas, and FastAPI workflows.`,
      intent: 'tech_python',
      navigate_to: '/programs?tab=training',
      followups: ['What training programs are available?', 'What events are coming up?'],
      suggestions: [],
      language: lang
    };
  }

  if (q.includes('artificial intelligence') || q.includes('what is ai') || q.includes('machine learning') || q.includes('llm')) {
    let reply = '';
    if (lang === 'bisaya') {
      reply = `🤖 **Artificial Intelligence (AI):**\n\nAng **AI** nagpasabot sa mga algorithms ug computer systems nga makat-on ug makasulbad og komplikadong mga problema sama sa natural language processing, computer vision, ug predictive modeling. Sa DASIG, nagtanyag kami og mga sertipikadong bootcamps sa AI kauban ang DICT ug DOST!`;
    } else if (lang === 'tagalog') {
      reply = `🤖 **Artificial Intelligence (AI):**\n\nAng **AI** ay tumutukoy sa mga computer algorithm na may kakayahang magsagawa ng mga gawaing nangangailangan ng talino ng tao tulad ng natural language processing at pagsusuri ng datos. Sa DASIG, may mga accredited bootcamps tayo sa AI katuwang ang DICT at DOST!`;
    } else {
      reply = `🤖 **Artificial Intelligence (AI) & Machine Learning:**\n\n**Artificial Intelligence (AI)** represents computational systems capable of performing cognitive tasks including reasoning, language synthesis, and pattern recognition. The DASIG consortium actively promotes regional AI capability through faculty development bootcamps with DICT-7 and DOST-7.`;
    }
    return {
      reply,
      intent: 'ai_overview',
      navigate_to: '/programs?tab=training',
      followups: ['What training programs are available?', 'Tell me about the AI Summit'],
      suggestions: [],
      language: lang
    };
  }

  // 4. Region VII / Cebu Geography
  if (q.includes('cebu') || q.includes('region vii') || q.includes('central visayas') || q.includes('bohol')) {
    return {
      reply: `🇵🇭 **Region VII (Central Visayas) Academic Hub:**\n\n**Central Visayas** encompasses Cebu, Bohol, Negros Oriental, and Siquijor. It is the premier educational and IT-BPM center of the southern Philippines, anchored by the **DASIG Consortium** with host node **CIT-University** in Cebu City collaborating with UP Visayas, University of San Agustin, DOST-7, DICT-7, DTI-7, and DepEd-7.`,
      intent: 'geography',
      navigate_to: '/members',
      followups: ['Who are the member institutions?', 'What events are coming up?'],
      suggestions: [],
      language: lang
    };
  }

  // 5. Contextual Memory / Follow-up Continuation
  if (Array.isArray(history) && history.length > 0) {
    const lastBot = [...history].reverse().find(m => (m.role === 'assistant' || m.from === 'bot') && (m.content || m.text));
    const lastTxt = (lastBot?.content || lastBot?.text || '').toLowerCase();

    if (/^(how to register|how to join|where is it|when|details|elaborate|unsaon|paano)\b/i.test(q)) {
      if (lastTxt.includes('event') || lastTxt.includes('summit')) {
        return {
          reply: `🎟️ **Event Registration Guide (Follow-up):**\n\nTo secure your seat for the discussed **Consortium Event**:\n1. Head to **[Programs > Events](/programs?tab=events)**.\n2. Tap the **"Register"** button.\n3. An official digital pass with an encrypted check-in QR code will be generated immediately for you!`,
          intent: 'event_register',
          navigate_to: '/programs?tab=events',
          followups: ['What other events are scheduled?', 'How do I become a member?'],
          suggestions: [],
          language: lang
        };
      }
      if (lastTxt.includes('training') || lastTxt.includes('bootcamp')) {
        return {
          reply: `🎓 **Bootcamp Enrollment (Follow-up):**\n\nTo enroll in the **Faculty Development Program**:\n1. Open the **[Training Module](/programs?tab=training)**.\n2. Select your course track and click **"Enroll"**.\n3. Complete the modules to receive a verified tamper-evident completion certificate!`,
          intent: 'training_enroll',
          navigate_to: '/programs?tab=training',
          followups: ['What events are coming up?', 'What funding is available?'],
          suggestions: [],
          language: lang
        };
      }
    }
  }

  // 6. Intelligent Cognitive Synthesis Fallback (Authoritative & Contextual)
  let fallbackReply = '';
  if (lang === 'bisaya') {
    fallbackReply = `🦅 **Haribon AI — Kaalam sa Konsorsyum:**\n\nNakasabot ko sa imong pangutana bahin sa **"${raw}"**.\n\nIsip opisyal nga virtual assistant sa **DASIG Regional Consortium (Central Visayas)**, makahatag ko og tabang sa mga mosunod:\n\n• 🏛️ **Mahitungod sa DASIG:** Konsorsyum sa CIT-U, UPV, USA, DOST, ug DICT.\n• 📅 **Events & Summits:** Mga eskedyul ug rehistrasyon sa [Programs Module](/programs?tab=events).\n• 🎓 **Faculty Bootcamps:** Pagsasanay sa AI, Web, ug panukiduki.\n• 💰 **Research Grants:** Mga pondo gikan sa DOST-7.\n• 👥 **Membership:** Pag-apil isip opisyal nga miyembro sa [Membership](/membership).\n\n💡 *Unsay partikular nga bahin ang gusto nimong masayran?*`;
  } else if (lang === 'tagalog') {
    fallbackReply = `🦅 **Haribon AI — Talino ng Konsorsyum:**\n\nNauunawaan ko ang iyong katanungan tungkol sa **"${raw}"**.\n\nBilang opisyal na virtual assistant ng **DASIG Regional Consortium (Central Visayas)**, maaari kitang gabayan sa mga sumusunod:\n\n• 🏛️ **Tungkol sa DASIG:** Konsorsyum ng CIT-U, UPV, USA, DOST, at DICT.\n• 📅 **Events & Summits:** Iskedyul at pagpaparehistro sa [Programs Module](/programs?tab=events).\n• 🎓 **Faculty Bootcamps:** Pagsasanay sa AI, Web, at pananaliksik.\n• 💰 **Research Grants:** Pondo at tulong pinansyal mula sa DOST-7.\n• 👥 **Membership:** Pagsali bilang opisyal na miyembro sa [Membership](/membership).\n\n💡 *Aling bahagi ang nais mong buksan ngayon?*`;
  } else {
    fallbackReply = `🦅 **Haribon AI — Consortium Intelligence:**\n\nI processed your inquiry regarding **"${raw}"**.\n\nAs the intelligent assistant for the **DASIG Regional Academic Consortium (Region VII)**, I can directly guide you across our core modules:\n\n• 🏛️ **About DASIG:** Our mission and 7 partner institutions (CIT-U, UP Visayas, Univ. of San Agustin, DOST, DICT, DTI, DepEd).\n• 📅 **Events & Summits:** Live schedules and instant QR seat booking in the **[Programs Module](/programs?tab=events)**.\n• 🎓 **Faculty Development:** Certified bootcamps and verifiable digital micro-credentials.\n• 💰 **Research Funding:** DOST-7 Grants-In-Aid (GIA) and collaborative funding calls.\n• 👥 **Institutional Membership:** Elevating privileges in the **[Membership Portal](/membership)**.\n\n💡 *Which specific area would you like to explore?*`;
  }

  return {
    reply: fallbackReply,
    intent: 'cognitive_fallback',
    navigate_to: null,
    followups: ['What is DASIG?', 'What events are coming up?', 'How to apply for membership?'],
    suggestions: [],
    language: lang
  };
}
