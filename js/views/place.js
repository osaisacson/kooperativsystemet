// Plats: väljaren överst (‹ Göteborg ›) och fälten där man anger var man håller till.
// Att kunna se det som händer i en stadsdel, en stad, en region, ett land eller hela världen är kärnan i appen.
import { html, useState, useEffect, useRef } from '../lib.js';
import { useStore, setPlace } from '../store.js';
import { Sheet } from '../ui.js';
import { LEVELS, SE_REGIONS, placeLabel, zoomOut, zoomIn, pc3, fmtPostcode, lookupPostcode, countryNames } from '../util.js';

const lc = (x) => (x || '').toLowerCase();
const LEVEL_TITLE = { country: 'land', region: 'region', city: 'stad', district: 'stadsdel' };

// Alla platser där det finns grupper, per nivå, med antal grupper. Samma regler som inPlace().
export function placeOptions(groups) {
  const maps = { country: new Map(), region: new Map(), city: new Map(), district: new Map() };
  const add = (level, key, o) => {
    const m = maps[level]; const x = m.get(key) || { ...o, level, n: 0, pcs: [] }; x.n++;
    if (level === 'district' && !x.pcs.includes(fmtPostcode(o.postcode))) x.pcs.push(fmtPostcode(o.postcode));
    m.set(key, x);
  };
  for (const g of groups) {
    const c = lc(g.country);
    if (g.country) add('country', c, { country: g.country });
    if (g.region) add('region', `${c}|${lc(g.region)}`, { region: g.region, country: g.country });
    if (g.city) add('city', `${c}|${lc(g.city)}`, { city: g.city, region: g.region, country: g.country });
    if (pc3(g.postcode)) add('district', `${c}|${pc3(g.postcode)}`, { postcode: g.postcode, city: g.city, region: g.region, country: g.country });
  }
  const name = (o) => (o.level === 'district' ? pc3(o.postcode) : o[o.level]);
  const sort = (m) => [...m.values()].sort((a, b) => b.n - a.n || name(a).localeCompare(name(b), 'sv'));
  return { country: sort(maps.country), region: sort(maps.region), city: sort(maps.city), district: sort(maps.district) };
}

// En stadsdel är alla postnummer med samma tre första siffror. Namnen hämtas i bakgrunden från
// upp till tre postnummer i varje (t.ex. ”Kungsladugård, Sanna”), så att man känner igen området.
function useDistrictNames(list) {
  const [names, setNames] = useState({});
  const key = list.map((o) => pc3(o.postcode)).join(',');
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const o of list.slice(0, 20)) {
        const found = [];
        for (const pc of (o.pcs || [o.postcode]).slice(0, 3)) {
          const hit = await lookupPostcode(pc, o.city || '');
          if (!alive) return;
          if (hit?.district && !found.includes(hit.district)) found.push(hit.district);
        }
        if (found.length) setNames((n) => ({ ...n, [pc3(o.postcode)]: found.join(', ') }));
      }
    })();
    return () => { alive = false; };
  }, [key]);
  return names;
}

// Rad under platsnamnet: vilken nivå det är och vad den ligger i.
function placeContext(p) {
  if (!p || p.level === 'world') return 'Alla platser';
  if (p.level === 'country') return 'Land';
  if (p.level === 'region') return p.country ? `Region i ${p.country}` : 'Region';
  if (p.level === 'city') return `Stad${p.region || p.country ? ' i ' + (p.region || p.country) : ''}`;
  return `Stadsdel i ${p.city || p.country || ''} · ${pc3(p.postcode)}`;
}

// Väljaren överst: ‹ Göteborg ›. Vänsterpilen zoomar ut (stad → region → land → hela världen), högerpilen
// zoomar in igen. Trycker man på namnet kan man skriva för att byta till ett annat land, en annan stad osv.
export function PlaceSwitcher({ groups }) {
  const s = useStore();
  const place = s.place || { level: 'world' };
  const [picking, setPicking] = useState(null);   // nivån man byter på, eller null
  const out = place.level === 'world' ? null : zoomOut(place);
  const inner = zoomIn(place);
  const nextLevel = LEVELS[LEVELS.indexOf(place.level) + 1];
  return html`<div class="placebar">
      <button class="zoom" disabled=${!out} onClick=${() => setPlace(out)}
        aria-label=${out ? `Zooma ut till ${placeLabel(out)}` : 'Zooma ut'} title=${out ? placeLabel(out) : ''}>‹</button>
      <button class="place-btn" onClick=${() => setPicking(place.level === 'world' ? 'country' : place.level)}
        aria-label=${`Visar ${placeLabel(place)}. Tryck för att byta`}>
        <span class="place-name">${placeLabel(place)}</span>
        <span class="place-ctx">${placeContext(place)}</span>
      </button>
      <button class="zoom" disabled=${!nextLevel} onClick=${() => (inner ? setPlace(inner) : setPicking(nextLevel))}
        aria-label=${inner ? `Zooma in till ${placeLabel(inner)}` : nextLevel ? `Välj ${LEVEL_TITLE[nextLevel]}` : 'Zooma in'}
        title=${inner ? placeLabel(inner) : nextLevel ? `Välj ${LEVEL_TITLE[nextLevel]}` : ''}>›</button>
    </div>
    ${picking && html`<${PlacePicker} level=${picking} place=${place} groups=${groups} onClose=${() => setPicking(null)} />`}`;
}

// Byt plats på en nivå: skriv för att söka. Platser i samma land/region/stad som nu visas först.
function PlacePicker({ level, place, groups, onClose }) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);   // stadsdel som slagits upp från ett postnummer
  const opts = placeOptions(groups)[level];
  const parentKey = { country: null, region: 'country', city: 'region', district: 'city' }[level];
  const near = (o) => (parentKey && place[parentKey] && lc(o[parentKey]) === lc(place[parentKey]) ? 0 : 1);
  const names = useDistrictNames(level === 'district' ? opts.filter((o) => !near(o)).concat(opts.filter(near)).slice(0, 30) : []);
  const label = (o) => (o.level === 'district' ? names[pc3(o.postcode)] || `Postnummer ${pc3(o.postcode)}` : o[o.level]);
  const sub = (o) => (o.level === 'district' ? [`${pc3(o.postcode)} xx`, o.city] : [o.level === 'city' && o.region, o.level !== 'country' && o.country]).filter(Boolean).join(' · ');
  const needle = lc(q.trim());
  const rank = (o) => { const n = lc(label(o)); return n.startsWith(needle) || (o.level === 'district' && pc3(o.postcode).startsWith(needle.replace(/\D/g, '') || 'x')) ? 0 : n.includes(needle) ? 1 : lc(sub(o)).includes(needle) ? 2 : 3; };
  const list = opts.map((o) => [needle ? rank(o) : 0, near(o), o]).filter(([r]) => r < 3)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([, , o]) => o);
  const isOn = (o) => place.level === level && (level === 'district' ? pc3(o.postcode) === pc3(place.postcode) : lc(o[level]) === lc(place[level]))
    && lc(o.country) === lc(place.country);
  // Ett postnummer som inte finns i listan slås upp, så att man kan välja vilken stadsdel som helst.
  const digits = q.replace(/\D/g, '');
  useEffect(() => {
    setFound(null);
    if (level !== 'district' || digits.length !== 5) return;
    let alive = true;
    lookupPostcode(digits, '').then((h) => alive && setFound(h || false));
    return () => { alive = false; };
  }, [level, digits]);

  // Att välja en plats på en nivå tömmer nivåerna inuti (de hör till den gamla platsen).
  function pick(o, extra = {}) {
    const keep = { country: [], region: ['country'], city: ['country', 'region'], district: ['country', 'region', 'city'] }[level];
    const base = { level };
    for (const k of keep) base[k] = (k in o ? o[k] : place[k]) ?? null;
    if (level === 'district') Object.assign(base, { postcode: o.postcode, district: names[pc3(o.postcode)] || o.district || null });
    else base[level] = o[level];
    setPlace({ ...base, ...extra });
    onClose();
  }
  const exact = list.some((o) => lc(label(o)) === needle);
  const free = q.trim() && level !== 'district' && !exact;
  return html`<${Sheet} onClose=${onClose}>
    <div class="pick-head">
      <div class="pick-title">Byt ${LEVEL_TITLE[level]}</div>
      <input type="search" class="scale-search" value=${q} onInput=${(e) => setQ(e.target.value)} autofocus
        inputmode=${level === 'district' ? 'numeric' : undefined}
        placeholder=${level === 'district' ? 'Skriv ett postnummer' : `Skriv namnet på ${{ country: 'ett land', region: 'en region', city: 'en stad' }[level]}`} aria-label="Sök plats" />
    </div>
    ${level === 'district' && digits.length === 5 && found !== null && html`<button class="sheet-item place-opt" disabled=${!found}
        onClick=${() => found && pick({ postcode: fmtPostcode(digits), city: found.city || place.city, region: found.region || (found.city ? null : place.region), country: found.country || place.country }, { district: found.district || null })}>
      <span class="place-opt-main">${found ? found.district || `Postnummer ${fmtPostcode(digits)}` : 'Hittar inte det postnumret'}<small class="muted">${found ? [fmtPostcode(digits), found.city].filter(Boolean).join(' · ') : ''}</small></span></button>`}
    ${list.map((o) => html`<button class=${'sheet-item place-opt' + (isOn(o) ? ' on' : '')} onClick=${() => pick(o)}>
      <span class="place-opt-main">${label(o)}${sub(o) && html`<small class="muted">${sub(o)}</small>`}</span>
      <small class="muted">${o.n} ${o.n === 1 ? 'grupp' : 'grupper'}</small></button>`)}
    ${free && html`<button class="sheet-item place-opt" onClick=${() => pick({ [level]: q.trim().replace(/^./, (m) => m.toUpperCase()) })}>
      <span class="place-opt-main">Visa ”${q.trim()}”<small class="muted">Inga grupper där än</small></span></button>`}
    ${!list.length && !free && !(level === 'district' && digits.length === 5) && html`<p class="empty small">${needle ? 'Inget som matchar.' : 'Inga grupper har angett det än.'}</p>`}
  <//>`;
}

// Fält som föreslår det som redan finns medan man skriver, men där man också kan skriva något nytt.
export function Combo({ label, value, options, onInput, onCommit, placeholder, autoFocus, committed }) {
  const [open, setOpen] = useState(false);
  const picked = useRef(false);
  const needle = lc((value || '').trim());
  const hits = (needle ? options.filter((o) => lc(o.name).includes(needle)).sort((a, b) => (lc(b.name).startsWith(needle) - lc(a.name).startsWith(needle))) : options).slice(0, 7);
  const exact = options.find((o) => lc(o.name) === needle);
  const commit = (name) => { picked.current = true; setOpen(false); onCommit(name); };
  return html`<label>${label}<div class="typeahead">
    <input value=${value || ''} placeholder=${placeholder} autocomplete="off" autoFocus=${autoFocus}
      onFocus=${() => { picked.current = false; setOpen(true); }}
      onInput=${(e) => { picked.current = false; setOpen(true); onInput(e.target.value); }}
      onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); if (needle) commit(exact?.name || hits[0]?.name || value.trim()); } }}
      onBlur=${() => setTimeout(() => { setOpen(false); if (!picked.current && exact) onCommit(exact.name); }, 180)} />
    ${!open && needle && !committed && html`<small class="pc-state">Välj i listan, eller skriv klart och välj ”Lägg till”.</small>`}
    ${open && (hits.length > 0 || (needle && !exact)) && html`<div class="ta-list" role="listbox">
      ${hits.map((o) => html`<button type="button" role="option" class="ta-item" onPointerDown=${() => { picked.current = true; }} onClick=${() => commit(o.name)}>
        <span class="ta-name">${o.name}</span>${o.sub && html`<small class="muted">${o.sub}</small>`}</button>`)}
      ${needle && !exact && html`<button type="button" class="ta-item ta-new" onPointerDown=${() => { picked.current = true; }}
        onClick=${() => commit(value.trim().replace(/^./, (m) => m.toUpperCase()))}>+ Lägg till ”${value.trim()}”</button>`}
    </div>`}
  </div></label>`;
}

// Var man håller till: land → region → stad → stadsdel (postnummer), och vilken nivå appen ska starta på.
// Varje fält visas när det förra är ifyllt. value: { country, region, city, postcode, district, level }
export function HomePlaceFields({ value, onChange, groups }) {
  const v = value;
  const [draft, setDraft] = useState({ country: v.country || '', region: v.region || '', city: v.city || '' });
  const [pcState, setPcState] = useState('');
  const set = (patch) => onChange({ ...v, ...patch });
  const all = groups || [];
  const count = (k, match) => { const m = new Map(); for (const g of all) if (g[k] && match(g)) { const key = g[k]; m.set(key, (m.get(key) || 0) + 1); } return m; };
  const opt = (m, extra = []) => {
    const seen = new Set([...m.keys()].map(lc));
    return [...[...m.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, sub: `${n} ${n === 1 ? 'grupp' : 'grupper'}` })),
      ...extra.filter((x) => !seen.has(lc(x))).map((name) => ({ name }))];
  };
  const countries = opt(count('country', () => true), countryNames());
  const regions = v.country ? opt(count('region', (g) => lc(g.country) === lc(v.country)), lc(v.country) === 'sverige' ? SE_REGIONS : []) : [];
  const inRegion = count('city', (g) => lc(g.country) === lc(v.country) && lc(g.region) === lc(v.region));
  // Städer i den valda regionen först, sedan andra städer i landet (med sin region utskriven).
  const regionOf = new Map(all.filter((g) => g.city && lc(g.country) === lc(v.country)).map((g) => [lc(g.city), g.region]));
  const cities = v.country ? [...opt(inRegion), ...[...count('city', (g) => lc(g.country) === lc(v.country)).entries()]
    .filter(([name]) => !inRegion.has(name)).map(([name]) => ({ name, sub: regionOf.get(lc(name)) || '' }))] : [];

  const DOWN = { country: ['region', 'city', 'postcode', 'district'], region: ['city', 'postcode', 'district'], city: ['postcode', 'district'] };
  // Skriver man om ett valt fält gäller valet inte längre – fälten under döljs tills man valt igen.
  const typing = (k, t) => {
    setDraft((d) => ({ ...d, [k]: t }));
    if (v[k] && t !== v[k]) set({ [k]: null, ...Object.fromEntries(DOWN[k].map((x) => [x, null])), level: v.level === 'district' ? 'city' : v.level });
  };
  // Ett nytt val längre upp tömmer fälten under.
  const commit = (k, name) => {
    const down = DOWN[k];
    setDraft((d) => ({ ...d, [k]: name, ...Object.fromEntries(down.filter((x) => x in d).map((x) => [x, ''])) }));
    if (v[k] && lc(name) === lc(v[k])) return set({ [k]: name });
    // En stad som redan finns i en annan region tar med sig sin region.
    const region = k === 'city' && regionOf.get(lc(name));
    if (region && lc(region) !== lc(v.region)) setDraft((d) => ({ ...d, region }));
    set({ [k]: name, ...(region ? { region } : {}), ...Object.fromEntries(down.map((x) => [x, null])), level: v.level === 'district' ? 'city' : v.level });
    setPcState('');
  };
  async function postcode(text) {
    const d = text.replace(/\D/g, '').slice(0, 5);
    set({ postcode: d ? (d.length === 5 ? fmtPostcode(d) : text) : null, district: null, ...(d.length < 5 && v.level === 'district' ? { level: 'city' } : {}) });
    if (d.length !== 5) { setPcState(''); return; }
    setPcState('…');
    const hit = await lookupPostcode(d, v.city || '');
    setPcState(hit?.district ? hit.district : hit ? 'Postnumret finns' : 'Hittar inte postnumret – stämmer det?');
    if (hit?.district) onChange({ ...v, postcode: fmtPostcode(d), district: hit.district });
  }
  const levels = [['country', 'Land'], ['region', 'Region'], ['city', 'Stad'], ['district', 'Stadsdel']];
  const can = (l) => (l === 'district' ? !!(v.postcode && v.postcode.replace(/\D/g, '').length === 5) : !!v[l]);
  return html`<fieldset class="field place-fields home-place">
    <legend class="label">Var håller du till?</legend>
    <${Combo} label="Land" value=${draft.country} options=${countries} placeholder="Börja skriva, t.ex. Sverige"
      committed=${!!v.country} onInput=${(t) => typing('country', t)} onCommit=${(n) => commit('country', n)} />
    ${v.country && html`<${Combo} label="Region" value=${draft.region} options=${regions} placeholder=${lc(v.country) === 'sverige' ? 'Börja skriva, t.ex. Västra Götalands län' : 'Börja skriva'}
      committed=${!!v.region} onInput=${(t) => typing('region', t)} onCommit=${(n) => commit('region', n)} />`}
    ${v.country && v.region && html`<${Combo} label="Stad" value=${draft.city} options=${cities} placeholder="Börja skriva, t.ex. Göteborg"
      committed=${!!v.city} onInput=${(t) => typing('city', t)} onCommit=${(n) => commit('city', n)} />`}
    ${v.city && html`<label>Stadsdel <small>(ditt postnummer)</small>
      <input inputmode="numeric" autocomplete="postal-code" value=${v.postcode || ''} placeholder="t.ex. 414 51" onInput=${(e) => postcode(e.target.value)} />
      ${pcState && html`<small class=${'pc-state' + (v.district ? ' ok' : '')}>${pcState}</small>`}</label>`}
    ${v.city && html`<div class="start-level">
      <span class="small">Starta med att se innehåll på den här nivån <span class="muted">(du kan ändra sen)</span></span>
      <div class="seg" role="radiogroup">${levels.map(([l, t]) => html`<button type="button" role="radio" aria-checked=${v.level === l}
        class=${v.level === l ? 'on' : ''} disabled=${!can(l)} onClick=${() => set({ level: l })}>${t}</button>`)}</div>
      ${v.level && html`<small class="muted">Du ser det som händer i <b>${placeLabel({ ...v, level: v.level })}</b>${v.level !== 'country' ? html` – zooma ut med <b>‹</b> överst.` : '.'}</small>`}
    </div>`}
  </fieldset>`;
}

// Kontroll innan sparande: land, region och stad krävs.
export function checkHome(v) {
  if (!v.country) return 'Fyll i vilket land du håller till i.';
  if (!v.region) return 'Fyll i region.';
  if (!v.city) return 'Fyll i stad.';
  return null;
}
export const emptyHome = () => ({ country: '', region: '', city: '', postcode: null, district: null, level: 'city' });
