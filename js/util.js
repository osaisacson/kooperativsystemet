// Typ av inlägg.
export const POST_TYPES = { vanlig: 'Vanlig post', finansiering: 'Tillgänglig finansiering', lokal: 'Lokal att låna eller hyra' };
export const postType = (p) => p.kind || (p.fin_total != null ? 'finansiering' : 'vanlig');

// Lokaler: vad de kan användas till och vad de kostar.
export const DEFAULT_FUNCTIONS = ['Verkstad', 'Kök', 'Möteslokal', 'Förråd', 'Odling', 'Ateljé', 'Övernattning'];
export const SPACE_COSTS = { gratis: 'Gratis', gentjanst: 'Mot gentjänst', kostar: 'Kostar' };

// Plats: flödet kan visas för en stad, en region, ett land eller hela världen.
export const PLACE_LEVELS = { city: 'stad', region: 'region', country: 'land', world: '' };
export function placeLabel(place) {
  if (!place || place.level === 'world') return 'Hela världen';
  return place[place.level] || 'Hela världen';
}
export function inPlace(group, place) {
  if (!place || place.level === 'world') return true;
  if (!group) return false;  // inlägg utan grupp visas bara för hela världen
  const same = (k) => (group[k] || '').toLowerCase() === (place[k] || '').toLowerCase();
  if (place.level === 'country') return same('country');
  if (place.level === 'region') return same('country') && same('region');
  return same('country') && same('city');
}
export const countryNames = () => {
  try {
    const dn = new Intl.DisplayNames(['sv'], { type: 'region' });
    const codes = 'AD AE AF AL AM AO AR AT AU AZ BA BD BE BF BG BH BI BJ BO BR BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CY CZ DE DJ DK DO DZ EC EE EG ER ES ET FI FJ FR GA GB GE GH GM GN GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KR KW KZ LA LB LK LR LS LT LU LV LY MA MD ME MG MK ML MM MN MR MT MU MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PS PT PY QA RO RS RU RW SA SD SE SG SI SK SL SN SO SR SS SV SY TD TG TH TJ TL TN TR TT TW TZ UA UG US UY UZ VE VN YE ZA ZM ZW'.split(' ');
    return codes.map((c) => dn.of(c)).sort((a, b) => a.localeCompare(b, 'sv'));
  } catch { return ['Sverige', 'Norge', 'Danmark', 'Finland']; }
};

// "kooperativ.se" → "https://kooperativ.se". Tomt → null.
export function normalizeUrl(u) {
  u = (u || '').trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try { return new URL(u).href; } catch { throw new Error('Webbadressen ser inte rätt ut.'); }
}
export const prettyUrl = (u) => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
// Ämnen som föreslås för vanliga inlägg (fler kan skapas).
export const DEFAULT_CATEGORIES = ['Energi', 'Byggmetod', 'Off-grid', 'Vatten', 'Avfall', 'Mat', 'Ekonomi'];
export const PAYOUT_BANK_LIMIT = 5000; // över detta belopp betalas till bankkonto i stället för Swish

export const fmtKr = (n) => new Intl.NumberFormat('sv-SE').format(Math.round(Number(n) || 0)) + ' kr';
export const fmtDate = (iso) => new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
export const fmtDateTime = (iso) => new Date(iso).toLocaleString('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'nyss';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} tim`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: s > 300 * 86400 ? 'numeric' : undefined });
}

export const sortCategories = (names) => [
  ...DEFAULT_CATEGORIES.filter((d) => names.includes(d)),
  ...names.filter((n) => !DEFAULT_CATEGORIES.includes(n)).sort((a, b) => a.localeCompare(b, 'sv')),
];

// Räknar ut läget för en finansiering utifrån kommentarernas status.
export function financeSummary(post, comments) {
  if (post.fin_total == null) return null;
  let granted = 0, paid = 0, pending = 0;
  for (const c of comments) {
    if (c.status === 'granted') granted += Number(c.applied_amount);
    else if (c.status === 'paid') paid += Number(c.applied_amount);
    else if (c.status === 'applied') pending++;
  }
  const total = Number(post.fin_total);
  const expired = !!post.fin_expires_at && new Date(post.fin_expires_at) < new Date();
  const remaining = Math.max(0, total - granted - paid);
  return {
    total, mode: post.fin_mode, granted, paid, pending, remaining,
    closed: !!post.fin_closed, expired, expires_at: post.fin_expires_at,
    open: !post.fin_closed && !expired && remaining > 0,
  };
}

// Stängda/utgångna finansieringar visas inte i flödena (men finns kvar på profil och gruppsida).
export const visibleInFeed = (p) => !p.finance || !(p.finance.closed || p.finance.expired);

// Kontroll av ett nytt/ändrat inlägg, gemensam för båda backends.
export function normalizePostInput(input) {
  const kind = POST_TYPES[input.type] ? input.type : 'vanlig';
  const clean = (xs) => [...new Set((xs || []).map((c) => c.trim()).filter(Boolean))];
  const categories = kind === 'vanlig' ? clean(input.tags) : [];
  const slides = input.slides || [];
  const caption = (input.caption || '').trim();
  if (!slides.length && !caption) throw new Error('Lägg till minst en bild eller lite text.');
  let finance = null, space = null;
  if (kind === 'finansiering') {
    const total = Number(input.finance?.total);
    if (!(total > 0)) throw new Error('Ange hur mycket pengar som finns att söka.');
    const mode = input.finance?.mode === 'single' ? 'single' : 'split';
    finance = { total, mode, expiresAt: input.finance?.expiresAt || null };
  }
  if (kind === 'lokal') {
    const functions = clean(input.space?.functions);
    if (!functions.length) throw new Error('Välj minst en sak lokalen kan användas till.');
    const cost = SPACE_COSTS[input.space?.cost] ? input.space.cost : 'gratis';
    space = { functions, cost, price: cost === 'kostar' ? (input.space?.price || '').trim() || null : null };
  }
  return { groupId: input.groupId || null, caption, slides, kind, categories, isResource: kind !== 'vanlig' || categories.length > 0, finance, space };
}

export async function resizeImage(file, max = 1280, quality = 0.82) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Kunde inte läsa bilden.'));
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff'; // genomskinliga bilder (PNG) får vit bakgrund i stället för svart
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob(res, 'image/jpeg', quality));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const blobToDataURL = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(blob);
});
