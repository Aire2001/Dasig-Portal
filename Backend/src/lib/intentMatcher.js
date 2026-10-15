// Haribon intent matcher (INC-11)
//
// Replaces the previous substring + typo-tolerant matcher, which let common
// words pick an intent ("what" -> about_dasig, "good" -> greeting, "the" ->
// thanks) and always let the first-listed intent win a tie.
//
// How a keyword matches a message:
//   - phrase match: every word of the keyword appears, in order, in the message
//   - content match: every content word of the keyword (function words such as
//     "the", "is", "sa", "ng" removed) appears in the message, in any order,
//     after light stemming (events -> event, policies -> policy)
//   - typo match: a content word of 5+ letters within one edit (insert, delete,
//     substitute or swap two letters) of a keyword content word
// An intent's score is its best keyword score (longer keywords score higher)
// plus a small bonus for each extra keyword hit.
//
// Intents are grouped. A specific topic (events, training, policy ...) always
// beats the generic "about DASIG" answer, and both beat social replies
// (greeting, thanks, help), so "Hello, what events are coming up?" is an
// events question. Event registration is chosen when the message has both a
// registration verb and an event word.

const STOP = new Set([
  // English
  'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'do', 'does', 'did', 'i', 'me', 'my', 'mine',
  'you', 'your', 'we', 'our', 'us', 'it', 'its', 'this', 'that', 'these', 'those', 'there', 'here', 'what', 'whats',
  'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'can', 'could', 'will', 'would', 'should', 'may',
  'might', 'must', 'shall', 'of', 'to', 'in', 'on', 'at', 'for', 'from', 'by', 'with', 'about', 'as', 'and', 'or',
  'but', 'if', 'so', 'not', 'no', 'yes', 'any', 'some', 'all', 'please', 'tell', 'show', 'give', 'list', 'get',
  'find', 'know', 'want', 'need', 'like', 'just', 'also', 'too', 'very', 'really', 'into', 'than', 'then', 'up',
  'out', 'more', 'most', 'have', 'has', 'had', 'anything', 'something', 'thing', 'things', 'one', 'ones', 'much',
  'many', 'soon', 'now', 'today', 'year', 'month', 'week', 'next', 'read', 'see', 'view', 'open', 'available',
  // Bisaya / Cebuano
  'ang', 'sa', 'mga', 'ug', 'og', 'nga', 'ni', 'si', 'ba', 'ka', 'ko', 'mo', 'ta', 'kita', 'kami', 'ako', 'ikaw',
  'imo', 'akong', 'nimo', 'naa', 'wala', 'unsa', 'unsay', 'asa', 'kinsa', 'kanus', 'giunsa', 'pila', 'karon',
  'ron', 'diha', 'dinhi', 'kay', 'man', 'pud', 'pod', 'lang', 'na', 'ra', 'unta', 'palihug', 'makita', 'bay',
  // Tagalog / Filipino
  'ng', 'ay', 'at', 'po', 'tayo', 'sila', 'ano', 'anong', 'sino', 'saan', 'kailan', 'ilan', 'meron', 'mayroon',
  'naman', 'din', 'rin', 'pa', 'kung', 'para', 'ito', 'iyan', 'yung', 'ngayon', 'ngayong', 'buwan',
]);

// Topic groups: specific beats generic beats social.
const SPECIFIC = ['event_register', 'policy', 'partnerships', 'membership', 'funding', 'training',
  'member_institutions', 'events'];
const GENERIC = ['about_dasig'];
const SOCIAL = ['haribon', 'general_help', 'greeting', 'thanks'];

// Event registration = a registration verb together with an event word.
// ("attend" is left out: "workshops I can attend" asks what is on, not how to register.)
const REG_VERBS = new Set(['register', 'registration', 'registered', 'signup', 'reserve', 'rsvp',
  'join', 'rehistro', 'magparehistro', 'parehistro', 'magrehistro', 'magpa', 'apil', 'moapil', 'mosalmot',
  'sumali', 'salihan', 'mag-register']);
const EVENT_WORDS = new Set(['event', 'summit', 'seminar', 'workshop', 'conference', 'symposium', 'webinar',
  'forum', 'kalihokan', 'kaganapan', 'pagtitipon', 'kalihukan']);

function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

// Lower-case word list; hyphenated words also contribute their parts
// ("pag-rehistro" -> "pag-rehistro", "pag", "rehistro").
function tokenize(text) {
  const clean = String(text || '').toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/'s\b/g, '')
    .replace(/[^a-z0-9À-ɏ\-\s]/g, ' ');
  const out = [];
  for (const raw of clean.split(/\s+/)) {
    const w = raw.replace(/^-+|-+$/g, '');
    if (!w) continue;
    out.push(w);
    if (w.includes('-')) for (const part of w.split('-')) if (part) out.push(part);
  }
  return out;
}

const contentWords = (tokens) => tokens.filter(t => !STOP.has(t) && t.length > 1).map(stem);

// Edit distance with adjacent transposition (Damerau-Levenshtein, OSA)
function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return 2;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[m][n];
}

function hasWord(set, word) {
  if (set.has(word)) return true;
  if (word.length < 4) return false;
  for (const w of set) {
    if (w.length < 5 && word.length < 5) continue; // short words must match exactly
    if (editDistance(w, word) <= 1 || editDistance(w, stem(word)) <= 1) return true;
  }
  return false;
}

function containsPhrase(tokens, phrase) {
  if (!phrase.length || phrase.length > tokens.length) return false;
  outer: for (let i = 0; i + phrase.length <= tokens.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (tokens[i + j] !== phrase[j]) continue outer;
    return true;
  }
  return false;
}

// Pre-compute keyword forms once per knowledge base.
const prepared = new WeakMap();
function prepare(kb) {
  if (prepared.has(kb)) return prepared.get(kb);
  const p = kb.map(entry => ({
    entry,
    keywords: entry.keywords.map(kw => {
      const tokens = tokenize(kw);
      return { tokens, content: contentWords(tokens) };
    }),
  }));
  prepared.set(kb, p);
  return p;
}

function scoreEntry(item, tokens, contentSet) {
  let best = 0, hits = 0;
  for (const kw of item.keywords) {
    let s = 0;
    if (containsPhrase(tokens, kw.tokens)) s = kw.tokens.length + 1;
    else if (kw.content.length && kw.content.every(w => hasWord(contentSet, w))) s = kw.content.length;
    if (s > 0) { hits++; if (s > best) best = s; }
  }
  return best > 0 ? best + 0.25 * (hits - 1) : 0;
}

/**
 * Pick the intent for a message.
 * @returns {{ entry: object, score: number } | null}
 */
function matchIntent(kb, text) {
  const tokens = tokenize(text);
  // stemmed and unstemmed content words, so "evnts" can still match "events"
  const contentSet = new Set([...contentWords(tokens), ...tokens.filter(t => !STOP.has(t) && t.length > 1)]);
  const scored = prepare(kb).map(item => ({ entry: item.entry, score: scoreEntry(item, tokens, contentSet) }))
    .filter(s => s.score > 0);
  const byIntent = Object.fromEntries(scored.map(s => [s.entry.intent, s]));

  // Event registration rule (verb + event word)
  const raw = new Set(tokens);
  const hasReg = [...raw].some(t => REG_VERBS.has(t) || REG_VERBS.has(stem(t))) || containsPhrase(tokens, ['sign', 'up']);
  const hasEvent = [...contentSet].some(t => EVENT_WORDS.has(t));
  if (hasReg && hasEvent) {
    const entry = kb.find(e => e.intent === 'event_register');
    if (entry) return { entry, score: Math.max(3, byIntent.event_register ? byIntent.event_register.score : 0) };
  }

  for (const group of [SPECIFIC, GENERIC, SOCIAL]) {
    let pick = null;
    for (const intent of group) {
      const s = byIntent[intent];
      if (s && (!pick || s.score > pick.score)) pick = s; // ties keep the earlier (more specific) intent
    }
    if (pick) return pick;
  }
  // Anything not covered by the groups above (e.g. new intents) by plain score
  const rest = scored.filter(s => ![...SPECIFIC, ...GENERIC, ...SOCIAL].includes(s.entry.intent));
  if (rest.length) return rest.sort((a, b) => b.score - a.score)[0];
  return null;
}

// Words that show a message is about the portal or the consortium even when no
// intent matched; used to choose between "here is what I can help with" and
// the out-of-scope notice (BR-CB-04).
const DOMAIN = new Set(['dasig', 'consortium', 'konsorsyum', 'portal', 'haribon', 'region', 'rehiyon', 'dost',
  'dict', 'dti', 'deped', 'cit', 'citu', 'upv', 'usa', 'member', 'miyembro', 'membership', 'event', 'training',
  'grant', 'funding', 'scholarship', 'policy', 'partner', 'partnership', 'account', 'login', 'register',
  'password', 'tier', 'certificate', 'program', 'programs', 'news', 'announcement']);
function isDomainMessage(text) {
  return contentWords(tokenize(text)).some(w => DOMAIN.has(w));
}

module.exports = { matchIntent, isDomainMessage, tokenize, contentWords, STOP };
