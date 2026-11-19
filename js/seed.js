// Startdata så att appen inte är tom första gången.
// Används av demoläget direkt, och av tools/build-seed-sql.mjs för att skapa supabase/seed.sql.
// Tider anges som "h" = antal timmar sedan, så att datan alltid känns färsk.

const id = (prefix, n) => `${prefix}0000000-0000-4000-8000-0000000000${String(n).padStart(2, '0')}`;
export const U = (n) => id('a', n);
export const G = (n) => id('b', n);
export const P = (n) => id('c', n);
export const C = (n) => id('d', n);
export const H = (n) => id('e', n);
// Exempelbilder från Unsplash (fri licens, https://unsplash.com/license). Länkas direkt, laddas inte ner.
const photo = (id, size = 1080) => `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=crop&q=80&auto=format`;
const logo = (id) => photo(id, 400);

export const slideId = (postId, i) => `f00000${postId.slice(-2)}-0000-4000-8000-0000000000${String(i).padStart(2, '0')}`;

export const SEED = {
  // Ämnen man kan tagga vanliga inlägg med, så att andra hittar dem.
  categories: ['Energi', 'Byggmetod', 'Off-grid', 'Vatten', 'Avfall', 'Mat', 'Ekonomi'],

  profiles: [
    { id: U(1), name: 'Maja Ek', h: 5000, seen: 1 },
    { id: U(2), name: 'Johan Berg', h: 4800, seen: 3 },
    { id: U(3), name: 'Leila Haddad', h: 4500, seen: 2 },
    { id: U(4), name: 'Oskar Nilsson', h: 4200, seen: 6 },
    { id: U(5), name: 'Sara Wiklund', h: 4100, seen: 10 },
    { id: U(6), name: 'Amir Karimi', h: 3900, seen: 4 },
  ],

  groups: [
    { id: G(1), address: 'Gottsunda, Uppsala', lat: 59.8095, lng: 17.6230, country: 'Sverige', region: 'Uppsala län', city: 'Uppsala', name: 'Gråvattengruppen Gottsunda', created_by: U(1), h: 2000, avatar_url: logo('1525542419642-fb8c7259a04c'),
      description: 'Fem hushåll som renar sitt bad- och diskvatten i en vassbädd i stället för att skicka det till reningsverket. Vi dokumenterar allt så att andra kan bygga likadant.' },
    { id: G(2), address: 'Hägersten, Stockholm', lat: 59.2960, lng: 17.9790, country: 'Sverige', region: 'Stockholms län', city: 'Stockholm', name: 'Solkollektivet Hägersten', created_by: U(4), h: 3000, avatar_url: logo('1613665813446-82a78c468a1d'),
      description: 'Grannar som äger solpaneler tillsammans och delar på elen. Just nu: 24 paneler på garagetaket.' },
    { id: G(3), address: 'Majorna, Göteborg', lat: 57.6905, lng: 11.9160, country: 'Sverige', region: 'Västra Götalands län', city: 'Göteborg', name: 'Kompost & kretslopp Väster', created_by: U(3), h: 2500, avatar_url: logo('1716903282677-3a1b5c936b41'),
      description: 'Bokashi i trapphusen, maskkompost i källaren och jord tillbaka till odlingslådorna.' },
    { id: G(4), address: 'Sofielund, Malmö', lat: 55.5920, lng: 13.0120, country: 'Sverige', region: 'Skåne län', city: 'Malmö', name: 'Bytesringen Sofielund', created_by: U(5), h: 4000, avatar_url: logo('1499744349893-0c6de53516e6'),
      description: 'Vi byter tid, verktyg och tjänster utan pengar. En timme är en timme, oavsett vad man gör.' },
    { id: G(5), address: 'Luthagen, Uppsala', lat: 59.8640, lng: 17.6270, country: 'Sverige', region: 'Uppsala län', city: 'Uppsala', name: 'Lerhusbyggarna', created_by: U(6), h: 1800, avatar_url: logo('1467842976472-03f46c6b1e3d'),
      description: 'Vi lär oss bygga med lera, halm och kalk – material som finns nära och går att återbruka.' },
    { id: G(6), address: 'Backa, Hisingen, Göteborg', lat: 57.7470, lng: 11.9710, country: 'Sverige', region: 'Västra Götalands län', city: 'Göteborg',
      name: 'Andelsodlingen Hisingen', created_by: U(3), h: 1400, avatar_url: logo('1781785273371-a959f34bfab0'),
      description: 'Tjugo hushåll som delar på en odling, ett växthus och skörden. Alla jobbar några timmar i veckan.' },
    { id: G(7), address: 'Kungsladugård, Göteborg', lat: 57.6850, lng: 11.9020, country: 'Sverige', region: 'Västra Götalands län', city: 'Göteborg',
      name: 'Energigemenskapen Kungsladugård', created_by: U(6), h: 1100, avatar_url: logo('1694327671725-e2a81cda3436'),
      description: 'Tre bostadsrättsföreningar som delar solel, ett batteri och en elbilspool.' },
  ],

  members: [
    { g: G(1), u: U(1), role: 'admin', h: 2000 }, { g: G(1), u: U(2), h: 1500 }, { g: G(1), u: U(3), h: 1200 },
    { g: G(2), u: U(4), role: 'admin', h: 3000 }, { g: G(2), u: U(1), h: 900 }, { g: G(2), u: U(5), h: 800 },
    { g: G(3), u: U(3), role: 'admin', h: 2500 }, { g: G(3), u: U(6), h: 700 },
    { g: G(4), u: U(5), role: 'admin', h: 4000 }, { g: G(4), u: U(2), h: 1000 }, { g: G(4), u: U(6), h: 900 }, { g: G(4), u: U(4), h: 600 },
    { g: G(5), u: U(6), role: 'admin', h: 1800 }, { g: G(5), u: U(4), h: 500 },
    { g: G(6), u: U(3), role: 'admin', h: 1400 }, { g: G(6), u: U(1), h: 900 }, { g: G(6), u: U(6), h: 300 },
    { g: G(7), u: U(6), role: 'admin', h: 1100 }, { g: G(7), u: U(5), h: 700 }, { g: G(7), u: U(2), h: 200 },
  ],

  posts: [
    { id: P(1), group_id: G(1), author_id: U(1), h: 5, tags: ['Vatten', 'Byggmetod'],
      caption: 'Så byggde vi vår vassbädd för gråvatten – hela processen i tre bilder. Kostnad: ca 9 000 kr för fem hushåll. Fråga gärna!',
      slides: [
        { img: photo('1592483335937-a3213ac4a833'), text: '1. Vi grävde en bädd på 2 × 6 meter, 80 cm djup, och lade i en tät duk.' },
        { img: photo('1632199670702-3ea3f70909cb'), text: '2. Tvättad singel i botten, sand ovanpå. Fördelningsrör längs ena kortsidan.' },
        { img: photo('1600772066490-18c330d042c8'), text: '3. Planterade bladvass. Efter en säsong renar den allt bad- och diskvatten från fem hushåll.' },
      ] },
    { id: P(2), group_id: G(2), author_id: U(4), h: 30, kind: 'finansiering', fin_total: 40000, fin_mode: 'split', expires_days: 21,
      caption: 'Vi har fått 40 000 kr från kvarterets gemensamma kassa att dela ut till hushåll som vill testa egen solel eller batterilagring. Sök hur mycket du behöver och berätta kort vad du vill göra – vi beslutar löpande.',
      slides: [{ img: photo('1655300256335-beef51a914fe'), text: 'Paneler på ett av husen i kvarteret – nu vill vi hjälpa fler att komma igång.' }] },
    { id: P(3), group_id: G(4), author_id: U(5), h: 10, kind: 'lokal', space_functions: ['Verkstad'], space_cost: 'gratis',
      caption: 'Verkstadslokalen på Sofielundsvägen 12 är ledig tisdagar och torsdagar kl 17–21. Pelarborr, hyvelbänk och svets finns. Gratis för alla grupper här – skriv till mig så får du koden.',
      slides: [{ img: photo('1788296817269-8df0458ab799'), text: 'Hyvelbänken och väggen med handverktyg.' }] },
    { id: P(4), group_id: G(3), author_id: U(3), h: 20, tags: ['Avfall', 'Mat'],
      caption: 'Första skörden av maskkompost från källaren! 40 liter svart guld till odlingslådorna på gården.',
      slides: [{ img: photo('1492496913980-501348b61469'), text: 'Maskarna har jobbat sedan i mars.' }] },
    { id: P(5), group_id: G(5), author_id: U(6), h: 50, tags: ['Byggmetod'],
      caption: 'Vårt recept på lerputs som håller utomhus: 1 del lera, 3 delar sand, en näve hackad halm. Slutputsa med kalk.',
      slides: [
        { img: photo('1675134768072-d700f38ceef0'), text: 'Blandning i baljor – testa alltid en provyta först.' },
        { img: photo('1559173525-d16dfd7c17fe'), text: 'Första lagret på halmbalsväggen, ca 2 cm.' },
      ] },
    { id: P(6), group_id: G(1), author_id: U(2), h: 3,
      caption: 'Grävdag på lördag kl 10 – vi förlänger vassbädden så att hus nummer sex kan kopplas på. Fika finns!',
      slides: [{ img: photo('1715274036728-4385d95a5e9f'), text: 'Spadar och skottkärror står redo.' }] },
    { id: P(7), group_id: G(3), author_id: U(6), h: 26, kind: 'finansiering', fin_total: 5000, fin_mode: 'single', expires_days: 12,
      caption: '5 000 kr till en grupp som vill starta bokashi i sitt trapphus. Pengarna räcker till hinkar, strö och en introduktionskväll. Ansök som kommentar!',
      slides: [{ img: photo('1605522283494-4901a98d458e'), text: 'En veckas matrester från trapphuset – i bokashin blir de jord på några veckor.' }] },
    { id: P(8), group_id: G(2), author_id: U(5), h: 70, tags: ['Energi'],
      caption: 'Panelerna är uppe! Tack alla som bar, skruvade och fixade fika.',
      slides: [{ img: photo('1660330589243-4c640d878052'), text: '24 paneler, 9,6 kW.' }] },
    { id: P(9), group_id: G(4), author_id: U(4), h: 8,
      caption: 'Någon som har en lång stege att låna ut i helgen? Ska rensa hängrännor.', slides: [] },
    { id: P(10), group_id: G(3), author_id: U(6), h: 40, kind: 'lokal', space_functions: ['Verkstad', 'Ateljé'], space_cost: 'kostar', space_price: 'Se deras hemsida',
      caption: 'Tips för alla i Göteborg: Mikrofabriken är en delad verkstad där man kan använda maskiner och verktyg man inte har själv. Bra ställe att bygga prototyper eller laga saker tillsammans. Kolla deras hemsida för öppettider och vad det kostar.',
      slides: [{ img: photo('1759523146335-0069847ceb16'), text: 'Delade maskiner och arbetsbänkar.' }] },
    { id: P(11), group_id: G(6), author_id: U(3), h: 14, tags: ['Mat', 'Ekonomi'],
      caption: 'Första säsongen är slut: 1,2 ton grönsaker på 20 hushåll. Varje hushåll betalade 1 500 kr och jobbade tre timmar i veckan. Vi delar gärna vår budget och vårt schema.',
      slides: [{ img: photo('1781785273371-a959f34bfab0'), text: 'Skördefest i oktober.' }, { img: photo('1763844599737-be3850c60cea'), text: 'Sådd i april – alla hjälps åt.' }] },
    { id: P(12), group_id: G(6), author_id: U(3), h: 22, kind: 'finansiering', fin_total: 15000, fin_mode: 'split', expires_days: 30,
      caption: 'Vi har 15 000 kr över från ett kommunalt bidrag att dela ut till grupper som vill starta en odling på en gård eller i en park. Sök till frön, jord, verktyg eller pallkragar.',
      slides: [{ img: photo('1611843467160-25afb8df1074'), text: 'Pengar till frön, jord och pallkragar.' }] },
    { id: P(13), group_id: G(7), author_id: U(6), h: 7, kind: 'lokal', space_functions: ['Möteslokal', 'Kök'], space_cost: 'gentjanst', space_price: null,
      caption: 'Vår föreningslokal med kök går att låna kvällar och helger. I gengäld hjälper man till med en städdag per år.',
      slides: [{ img: photo('1781785161788-a906202dba8f'), text: 'Plats för ungefär 30 personer.' }] },
    { id: P(14), group_id: G(7), author_id: U(5), h: 30, tags: ['Energi', 'Off-grid'],
      caption: 'Batteriet i källaren har gjort att vi klarat oss utan köpt el 41 dagar i år. Här är hur vi styr när bilarna laddar så att solelen räcker.',
      slides: [{ img: photo('1726221062287-fda475b85493'), text: 'Växelriktare och batteri, 30 kWh.' }] },
    { id: P(15), group_id: G(2), author_id: U(4), h: 18, kind: 'lokal', space_functions: ['Verkstad'], space_cost: 'kostar', space_price: '100 kr per kväll',
      caption: 'Snickeriet i garaget går att hyra kvällstid. Bandsåg, rikt- och planhyvel finns. Ta med egna sågblad.',
      slides: [{ img: photo('1547609434-b732edfee020'), text: 'Snickeriet i garaget.' }] },
    { id: P(16), group_id: G(1), author_id: U(2), h: 36, kind: 'finansiering', fin_total: 8000, fin_mode: 'single', expires_days: 18,
      caption: '8 000 kr till en grupp som vill bygga sin första vassbädd eller sitt första gråvattenfilter. Vi kommer gärna och hjälper till en dag också.',
      slides: [{ img: photo('1651197227940-60c9d32f89e7'), text: 'Fördelningsrör till en ny bädd.' }] },
    { id: P(17), group_id: G(4), author_id: U(5), h: 26, tags: ['Ekonomi'],
      caption: 'Bytesringen har nu bytt 340 timmar i år: barnpassning, cykellagning, skjuts och snickeri. Vi använder ett enkelt delat kalkylark – vill ni ha mallen?',
      slides: [{ img: photo('1599651971621-7c42aaa20cd2'), text: 'Verktygen som lånas ut mest.' }] },
    { id: P(18), group_id: G(5), author_id: U(6), h: 60, kind: 'lokal', space_functions: ['Odling', 'Förråd'], space_cost: 'gratis',
      caption: 'Växthuset bakom lerhuset står tomt på vintern. Låna det för förodling eller som förråd för material.',
      slides: [{ img: photo('1781785178874-7e4a5ece4348'), text: 'Växthuset, 40 kvadratmeter.' }] },
  ],

  comments: [
    { id: C(1), post_id: P(1), author_id: U(3), h: 4, body: 'Så fint! Hur gör ni på vintern när det fryser?' },
    { id: C(2), post_id: P(1), author_id: U(1), h: 3.5, body: 'Vi leder vattnet till en sluten tank från december till mars. Skriver ett eget inlägg om det snart!' },
    { id: C(3), post_id: P(2), author_id: U(5), group_id: G(4), h: 28, amount: 8000, status: 'paid', payout: 'Bankkonto: 8327-9, 123 456 789-0',
      body: 'Vi vill sätta upp fyra paneler på förrådstaket i vår bostadsrättsförening och testa ett litet batteri.' },
    { id: C(4), post_id: P(2), author_id: U(1), group_id: G(1), h: 12, amount: 3000, status: 'applied', payout: 'Swish: 070-123 45 67',
      body: 'Jag vill köpa en mikroväxelriktare och två begagnade paneler till balkongen och dokumentera hur mycket de ger.' },
    { id: C(5), post_id: P(2), author_id: U(2), h: 6, body: 'Går det att söka för en gemensam laddbox också?' },
    { id: C(6), post_id: P(7), author_id: U(1), group_id: G(1), h: 9, amount: 5000, status: 'applied', payout: 'Swish: 070-123 45 67',
      body: 'Vi är tolv hushåll på Gottsundagatan som vill börja med bokashi. Vi har redan en plats i cykelrummet.' },
    { id: C(7), post_id: P(4), author_id: U(6), h: 18, body: 'Kan man få lite? Våra pallkragar behöver det 😊' },
    { id: C(8), post_id: P(5), author_id: U(4), h: 45, body: 'Vi testade receptet på vårt uthus – höll hela vintern!' },
    { id: C(9), post_id: P(9), author_id: U(2), h: 7, body: 'Jag har en på 6 meter, hämta när du vill!' },
    { id: C(10), post_id: P(3), author_id: U(6), h: 9, body: 'Perfekt, behöver svetsa ihop en kompostram. Hör av mig!' },
    { id: C(11), post_id: P(2), author_id: U(4), parent_id: C(5), h: 5, body: 'Ja, om flera hushåll delar på den. Sök som grupp och berätta hur många som ska använda den.' },
    { id: C(12), post_id: P(2), author_id: U(2), parent_id: C(11), h: 4, body: 'Toppen! Vi är fyra hushåll i Gottsunda – vi skriver ihop en ansökan i helgen.' },
    { id: C(13), post_id: P(1), author_id: U(3), parent_id: C(2), h: 3, body: 'Smart. Hur stor är tanken?' },
    { id: C(14), post_id: P(11), author_id: U(1), h: 12, body: 'Ja tack, budgeten skulle vi gärna se!' },
    { id: C(15), post_id: P(12), author_id: U(5), group_id: G(4), h: 20, amount: 4000, status: 'applied', payout: 'Swish: 070-000 00 01',
      body: 'Vi vill bygga tolv pallkragar på gården bakom Sofielundsvägen och starta en odlingsgrupp.' },
    { id: C(16), post_id: P(14), author_id: U(4), h: 28, body: 'Vilken styrning använder ni för laddningen?' },
    { id: C(17), post_id: P(14), author_id: U(5), parent_id: C(16), h: 27, body: 'Ett enkelt skript på en Raspberry Pi som läser elpriset och batterinivån. Delar gärna!' },
  ],

  highlights: [
    { id: H(1), group_id: G(1), title: 'Vassbädden', post_ids: [P(1), P(6)], h: 2 },
    { id: H(2), group_id: G(2), title: 'Bidrag', post_ids: [P(2)], h: 29 },
    { id: H(3), group_id: G(2), title: 'Bygget', post_ids: [P(8)], h: 60 },
    { id: H(4), group_id: G(5), title: 'Recept', post_ids: [P(5)], h: 49 },
  ],

  // Vem som vill spara vilka inlägg i långtidsminnet.
  memory: [
    { post_id: P(1), user_id: U(2) }, { post_id: P(1), user_id: U(3) }, { post_id: P(1), user_id: U(4) }, { post_id: P(1), user_id: U(6) },
    { post_id: P(5), user_id: U(1) }, { post_id: P(5), user_id: U(4) },
    { post_id: P(3), user_id: U(2) }, { post_id: P(3), user_id: U(6) }, { post_id: P(3), user_id: U(1) },
    { post_id: P(4), user_id: U(1) },
    { post_id: P(8), user_id: U(1) }, { post_id: P(8), user_id: U(3) },
    { post_id: P(11), user_id: U(1) }, { post_id: P(11), user_id: U(2) }, { post_id: P(11), user_id: U(6) },
    { post_id: P(14), user_id: U(1) }, { post_id: P(14), user_id: U(2) }, { post_id: P(14), user_id: U(3) }, { post_id: P(14), user_id: U(4) }, { post_id: P(14), user_id: U(6) },
    { post_id: P(17), user_id: U(2) }, { post_id: P(17), user_id: U(6) },
    { post_id: P(10), user_id: U(1) }, { post_id: P(10), user_id: U(3) },
  ],
};

// Senaste aktivitet (i timmar sedan) för inlägg och grupper: nytt inlägg eller ny kommentar.
export function activityHours() {
  const posts = {}, groups = {};
  for (const p of SEED.posts) posts[p.id] = p.h;
  for (const c of SEED.comments) posts[c.post_id] = Math.min(posts[c.post_id], c.h);
  for (const p of SEED.posts) if (p.group_id) groups[p.group_id] = Math.min(groups[p.group_id] ?? Infinity, posts[p.id]);
  return { posts, groups };
}

// Gör om fröet till färdiga rader med riktiga tidsstämplar (används av demoläget).
export function materializeSeed() {
  const iso = (h) => new Date(Date.now() - h * 3600e3).toISOString();
  const act = activityHours();
  return {
    categories: SEED.categories.map((name) => ({ name, created_at: iso(6000) })),
    profiles: SEED.profiles.map((p) => ({ id: p.id, name: p.name, avatar_url: null, created_at: iso(p.h), last_seen_at: iso(p.seen) })),
    groups: SEED.groups.map((g) => ({
      id: g.id, name: g.name, description: g.description, avatar_url: g.avatar_url, created_by: g.created_by,
      country: g.country, region: g.region, city: g.city, address: g.address ?? null, lat: g.lat ?? null, lng: g.lng ?? null, homepage: null,
      created_at: iso(g.h), last_activity_at: iso(act.groups[g.id] ?? g.h),
    })),
    members: SEED.members.map((m) => ({ group_id: m.g, user_id: m.u, role: m.role || 'member', joined_at: iso(m.h) })),
    highlights: SEED.highlights.map((h) => ({ id: h.id, group_id: h.group_id, title: h.title, post_ids: h.post_ids, created_at: iso(h.h) })),
    posts: SEED.posts.map((p) => ({
      id: p.id, author_id: p.author_id, group_id: p.group_id, caption: p.caption,
      kind: p.kind || 'vanlig', categories: p.tags || [], is_resource: !!(p.kind || p.tags?.length),
      space_functions: p.space_functions || [], space_cost: p.space_cost ?? null, space_price: p.space_price ?? null,
      fin_total: p.fin_total ?? null, fin_mode: p.fin_mode ?? null,
      fin_expires_at: p.expires_days != null ? new Date(Date.now() + p.expires_days * 864e5).toISOString() : null,
      fin_closed: false, created_at: iso(p.h), updated_at: iso(p.h), last_activity_at: iso(act.posts[p.id]),
      slides: p.slides.map((s, i) => ({ id: slideId(p.id, i), position: i, image_url: s.img, text: s.text || '' })),
    })),
    comments: SEED.comments.map((c) => ({
      id: c.id, post_id: c.post_id, author_id: c.author_id, group_id: c.group_id ?? null, parent_id: c.parent_id ?? null, body: c.body, created_at: iso(c.h),
      applied_amount: c.amount ?? null, status: c.status ?? null,
      decided_at: c.status && c.status !== 'applied' ? iso(c.h - 1) : null,
      paid_at: c.status === 'paid' ? iso(c.h - 2) : null,
    })),
    memory: SEED.memory.map((m) => ({ ...m, created_at: iso(1) })),
    payouts: Object.fromEntries(SEED.comments.filter((c) => c.payout).map((c) => [c.id, c.payout])),
  };
}
