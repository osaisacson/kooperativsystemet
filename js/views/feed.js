// Flödet, enskilt inlägg och skapa/redigera inlägg.
import { html, useState, useEffect } from '../lib.js';
import { api } from '../api/index.js';
import { useStore, useAsync, go, attempt, refreshBadges, setPlace } from '../store.js';
import { Icon, Avatar, Count, Header, PostCard, Comments, Loading, ErrorBox, Sheet } from '../ui.js';
import { PAYOUT_BANK_LIMIT, POST_TYPES, DEFAULT_FUNCTIONS, SPACE_COSTS, PLACE_LEVELS, postType, placeLabel, inPlace, fmtKr } from '../util.js';

// Tips om att spara appen på hemskärmen – visas på mobilen tills man stänger det.
function InstallHint() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const mobile = /iphone|ipad|android/i.test(navigator.userAgent);
  const read = () => { try { return localStorage.getItem('install-hint-closed') === '1'; } catch { return false; } };
  const [closed, setClosed] = useState(read);
  if (standalone || !mobile || closed) return null;
  const ios = /iphone|ipad/i.test(navigator.userAgent);
  const close = () => { try { localStorage.setItem('install-hint-closed', '1'); } catch {} setClosed(true); };
  return html`<div class="install-hint">
    <img src="icons/icon-192.png" alt="" width="40" height="40" />
    <span><strong>Spara som app</strong><br />${ios
      ? html`Tryck på <b>Dela</b> <span aria-hidden="true">⬆︎</span> och välj <b>Lägg till på hemskärmen</b>.`
      : html`Öppna menyn <b>⋮</b> och välj <b>Installera app</b> eller <b>Lägg till på startskärmen</b>.`}</span>
    <button class="iconbtn" aria-label="Stäng" onClick=${close}><${Icon} name="x" size=${18} /></button>
  </div>`;
}

const PLUS = html`<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

// Platsväljaren överst: stad → region → land → hela världen, plus andra städer där det finns grupper.
function PlaceSwitcher({ groups }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const place = s.place || { level: 'world' };
  const base = place.level === 'world' ? null : place;
  const options = [];
  if (base?.city) options.push({ level: 'city', city: base.city, region: base.region, country: base.country });
  if (base?.region) options.push({ level: 'region', region: base.region, country: base.country });
  if (base?.country) options.push({ level: 'country', country: base.country });
  options.push({ level: 'world' });
  const seen = new Set(options.filter((o) => o.level === 'city').map((o) => o.city.toLowerCase()));
  const others = [];
  for (const g of groups) {
    if (!g.city || seen.has(g.city.toLowerCase())) continue;
    seen.add(g.city.toLowerCase());
    others.push({ level: 'city', city: g.city, region: g.region, country: g.country });
  }
  others.sort((a, b) => a.city.localeCompare(b.city, 'sv'));
  const same = (a, b) => a.level === b.level && placeLabel(a) === placeLabel(b);
  const pick = (o) => { setPlace(o); setOpen(false); };
  const row = (o) => html`<button class=${'sheet-item place-opt' + (same(o, place) ? ' on' : '')} onClick=${() => pick(o)}>
    <span>${placeLabel(o)}</span>${o.level !== 'world' && html`<small class="muted">${PLACE_LEVELS[o.level]}</small>`}</button>`;
  return html`<button class="place-btn" onClick=${() => setOpen(true)} aria-label=${`Visar ${placeLabel(place)}. Byt plats`}>
      <span class="place-name">${placeLabel(place)}<span class="chev" aria-hidden="true">▾</span></span>
      ${place.level !== 'world' && html`<small class="place-hint">visar ${PLACE_LEVELS[place.level]} · byt till region eller land</small>`}
    </button>
    ${open && html`<${Sheet} onClose=${() => setOpen(false)}>
      ${options.map(row)}
      ${others.length > 0 && html`<div class="sheet-label">Andra städer</div>${others.map(row)}`}
    <//>`}`;
}

const TABS = [['flode', 'Flöde'], ['finansiering', 'Finansiering'], ['lokal', 'Lokaler'], ['minne', 'Minne']];

export function Home() {
  const s = useStore();
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem('tab') || 'flode'; } catch { return 'flode'; } });
  const [fn, setFn] = useState('');        // Lokaler: användningsområde (fritext)
  const [cost, setCost] = useState('');    // Lokaler: kostnad (fritext)
  const [memQ, setMemQ] = useState('');    // Minne: sökfält för ämnen
  const [memTags, setMemTags] = useState([]);
  const groups = useAsync(() => api.listGroups(), []);
  const posts = useAsync(() => api.listPosts({ feed: true }), []);
  const place = s.place || { level: 'world' };
  const fresh = (g) => Date.now() - new Date(g.last_activity_at) < 24 * 3600e3;
  const choose = (t) => { setTab(t); try { sessionStorage.setItem('tab', t); } catch {} };

  const here = (posts.data || []).filter((p) => inPlace(p.group, place));
  const finance = here.filter((p) => postType(p) === 'finansiering');
  const spaces = here.filter((p) => postType(p) === 'lokal');
  const available = finance.reduce((sum, p) => sum + (p.finance?.open ? p.finance.remaining : 0), 0);
  const functions = [...new Set(spaces.flatMap((p) => p.space_functions || []))].sort((a, b) => a.localeCompare(b, 'sv'));
  const has = (text, needle) => text.toLowerCase().includes(needle.trim().toLowerCase());
  const costText = (p) => `${SPACE_COSTS[p.space_cost] || ''} ${p.space_price || ''}`;
  const memory = here.filter((p) => p.memory_count > 0).sort((a, b) => b.memory_count - a.memory_count || b.created_at.localeCompare(a.created_at));
  const memoryTags = [...new Set(memory.flatMap((p) => p.categories || []))].sort((a, b) => a.localeCompare(b, 'sv'));
  const tagHits = memQ.trim() ? memoryTags.filter((t) => has(t, memQ) && !memTags.includes(t)) : [];
  const shown = tab === 'finansiering' ? finance
    : tab === 'lokal' ? spaces.filter((p) => (!fn.trim() || (p.space_functions || []).some((f) => has(f, fn))) && (!cost.trim() || has(costText(p), cost)))
    : tab === 'minne' ? memory.filter((p) => memTags.every((t) => p.categories?.includes(t)) && (!memQ.trim() || (p.categories || []).some((c) => has(c, memQ)) || has(p.caption, memQ)))
    : here;
  const localGroups = (groups.data || []).filter((g) => inPlace(g, place));
  const where = placeLabel(place);

  return html`<div class="page">
    <header class="topbar brand">
      <${PlaceSwitcher} groups=${groups.data || []} />
      <div class="topbar-side right">
        ${s.badges.todos > 0 && html`<a class="iconbtn" href="#/att-gora" aria-label="Att göra"><${Icon} name="check" /><${Count} n=${s.badges.todos} /></a>`}
        <a class="iconbtn" href="#/notiser" aria-label="Notiser"><${Icon} name="bell" /><${Count} n=${s.badges.notifications} /></a>
        <a class="iconbtn" href="#/meddelanden" aria-label="Meddelanden"><${Icon} name="chat" /><${Count} n=${s.badges.messages} /></a>
      </div>
    </header>
    ${api.mode === 'demo' && html`<div class="demo-banner">Demoläge – allt sparas bara i den här webbläsaren.
      <button class="link" onClick=${async () => { if (confirm('Återställ demodatan? Allt du skapat försvinner.')) { await api.resetDemo(); location.hash = '#/'; location.reload(); } }}>Återställ</button></div>`}

    <${InstallHint} />
    <div class="stories">
      <a class="story" href="#/ny-grupp"><span class="story-new">+</span><span class="story-name">Ny grupp</span></a>
      ${localGroups.map((g) => html`<a class="story" href=${'#/grupp/' + g.id} key=${g.id}>
        <span class=${'story-ring' + (fresh(g) ? ' fresh' : '')}><${Avatar} src=${g.avatar_url} name=${g.name} size=${60} /></span>
        <span class="story-name">${g.name}</span></a>`)}
    </div>

    <div class="filterbar" role="tablist">
      ${TABS.map(([k, label]) => html`<button role="tab" aria-selected=${tab === k} class=${tab === k ? 'on' : ''} onClick=${() => choose(k)}>
        ${label}${k === 'finansiering' && available > 0 ? html`<small class="tab-sum">${fmtKr(available)}</small>` : ''}</button>`)}
    </div>
    <div class="tab-head">
      <div class="tab-info">
        ${tab === 'flode' && html`<span class="muted small">Allt från grupperna i ${where}</span>`}
        ${tab === 'finansiering' && html`<span class="small"><strong>${fmtKr(available)}</strong> <span class="muted">går att söka i ${where} just nu</span></span>`}
        ${tab === 'lokal' && html`<span class="muted small">Lokaler att låna, använda mot en gentjänst eller hyra i ${where}</span>`}
        ${tab === 'minne' && html`<span class="muted small">Inlägg som är värda att minnas, för att andra kan ha nytta av dem. Tryck på <${Icon} name="memory" size=${13} /> längst ner till höger i ett inlägg för att spara det här.</span>`}
      </div>
      ${tab !== 'minne' && html`<a class="chip-add" href=${'#/ny?typ=' + (tab === 'flode' ? 'vanlig' : tab)} aria-label=${{ flode: 'Nytt inlägg', finansiering: 'Ny finansiering', lokal: 'Ny lokal' }[tab]}>${PLUS}</a>`}
    </div>
    ${tab === 'lokal' && html`<div class="space-filters">
      <label><input list="dl-fn" value=${fn} onInput=${(e) => setFn(e.target.value)} placeholder="Användningsområde" aria-label="Filtrera på användningsområde" />
        ${fn && html`<button class="clear" aria-label="Rensa" onClick=${() => setFn('')}>×</button>`}
        <datalist id="dl-fn">${functions.map((f) => html`<option value=${f} />`)}</datalist></label>
      <label><input list="dl-cost" value=${cost} onInput=${(e) => setCost(e.target.value)} placeholder="Kostnad" aria-label="Filtrera på kostnad" />
        ${cost && html`<button class="clear" aria-label="Rensa" onClick=${() => setCost('')}>×</button>`}
        <datalist id="dl-cost">${Object.values(SPACE_COSTS).map((c) => html`<option value=${c} />`)}</datalist></label>
    </div>`}
    ${tab === 'minne' && html`<div class="memory-search">
      <input type="search" value=${memQ} onInput=${(e) => setMemQ(e.target.value)} placeholder="Sök på ämne, t.ex. energi" aria-label="Sök på ämne" />
      ${(memTags.length > 0 || tagHits.length > 0) && html`<div class="chips wrap">
        ${memTags.map((t) => html`<button class="chip on" onClick=${() => setMemTags(memTags.filter((x) => x !== t))}>#${t.toLowerCase()} ×</button>`)}
        ${tagHits.map((t) => html`<button class="chip" onClick=${() => { setMemTags([...memTags, t]); setMemQ(''); }}>#${t.toLowerCase()}</button>`)}
      </div>`}
    </div>`}

    ${posts.loading && !posts.data ? html`<${Loading} />` : posts.error ? html`<${ErrorBox} error=${posts.error} />`
      : shown.length === 0 ? html`<p class="empty">${{ flode: 'Inga inlägg', finansiering: 'Ingen finansiering att söka', lokal: 'Inga lokaler', minne: 'Inget sparat i långtidsminnet' }[tab]} i ${where}${(fn || cost || memTags.length || memQ) ? ' som matchar' : ' än'}.
          ${place.level !== 'world' && html`<br /><span class="small">Tryck på <b>${where}</b> högst upp för att se region, land eller hela världen.</span>`}</p>`
      : shown.map((p) => html`<${PostCard} key=${p.id} post=${p} onChange=${posts.reload} />`)}
  </div>`;
}

export function PostView({ id }) {
  const post = useAsync(() => api.getPost(id), [id]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  async function send(e) {
    e.preventDefault();
    setBusy(true);
    if (await attempt(() => api.addComment(id, body))) { setBody(''); post.reload(); }
    setBusy(false);
  }
  return html`<div class="page">
    <${Header} title=${post.data?.finance ? 'Finansiering' : 'Inlägg'} back />
    ${post.loading && !post.data ? html`<${Loading} />` : post.error ? html`<${ErrorBox} error=${post.error} />` : html`
      <${PostCard} post=${post.data} full onChange=${post.reload} />
      <section class="comments-section">
        <h2 class="section-title">Kommentarer${post.data.finance ? ' och ansökningar' : ''}</h2>
        <${Comments} post=${post.data} onChange=${post.reload} />
      </section>
      <form class="comment-form" onSubmit=${send}>
        <input value=${body} onInput=${(e) => setBody(e.target.value)} placeholder="Skriv en kommentar…" aria-label="Kommentar" />
        <button class="link strong" disabled=${!body.trim() || busy}>Publicera</button>
      </form>`}
  </div>`;
}

const plusDays = (d) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

const TYPE_HELP = {
  vanlig: 'Syns i flödet, i gruppen och på din profil.',
  finansiering: 'Pengar som andra grupper kan söka. Syns under Finansiering.',
  lokal: 'En lokal andra kan låna, använda mot en gentjänst eller hyra. Syns under Lokaler.',
};
const TYPE_TITLE = { vanlig: 'Nytt inlägg', finansiering: 'Ny finansiering', lokal: 'Ny lokal' };

function FinanceSteps() {
  return html`<div class="steps">
    <strong>Så fungerar finansieringen</strong>
    <ol>
      <li>Du anger hur mycket pengar som finns, om de går till <em>en mottagare</em> eller kan sökas i <em>delbelopp</em> av flera, och hur länge inlägget ska ligga uppe.</li>
      <li>Den som vill söka trycker på <b>Ansök</b> på inlägget och skriver en motivering. Motiveringen blir en kommentar som alla kan läsa, märkt <span class="badge applied">Ansökt</span>.</li>
      <li>Den sökande anger också belopp och swishnummer – eller bankkonto om beloppet är över ${fmtKr(PAYOUT_BANK_LIMIT)}. Betalningsuppgifterna syns bara för dig och den sökande.</li>
      <li>Du får en notis för varje ansökan och trycker <b>Bevilja</b> eller <b>Avslå</b> direkt under kommentaren.</li>
      <li>Beviljade ansökningar hamnar i din att göra-lista (✓ uppe till höger), t.ex. ”Swisha Maja Ek 2 500 kr till 070-…”.</li>
      <li>Du betalar själv via Swish eller bank och bockar sedan av raden. Ansökan märks <span class="badge paid">Utbetald</span> och mätaren på inlägget visar hur mycket som finns kvar.</li>
    </ol>
    <small class="muted">Appen hanterar inga pengar – den håller bara ordning på ansökningar och utbetalningar. Du kan stänga finansieringen när som helst via ··· på inlägget.</small>
  </div>`;
}

// Chips att välja bland, plus ett fält för att lägga till nya.
function ChipPicker({ options, selected, onChange, placeholder }) {
  const [extra, setExtra] = useState([]);
  const [text, setText] = useState('');
  const all = [...new Set([...options, ...extra, ...selected])];
  const toggle = (c) => onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);
  function add() {
    const c = text.trim().replace(/^./, (m) => m.toUpperCase());
    setText('');
    if (!c) return;
    const existing = all.find((x) => x.toLowerCase() === c.toLowerCase()) || c;
    if (!all.includes(existing)) setExtra((xs) => [...xs, existing]);
    if (!selected.includes(existing)) onChange([...selected, existing]);
  }
  return html`<div>
    <div class="chips wrap">${all.map((c) => html`<button type="button" class=${'chip' + (selected.includes(c) ? ' on' : '')} onClick=${() => toggle(c)}>${c}</button>`)}</div>
    <div class="inline"><input value=${text} onInput=${(e) => setText(e.target.value)} placeholder=${placeholder}
      onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
      <button type="button" class="btn small" onClick=${add} disabled=${!text.trim()}>Lägg till</button></div>
  </div>`;
}

export function Compose({ groupId: initialGroup, type: initialType, editId }) {
  const s = useStore();
  const editing = !!editId;
  const fixedType = editing || !!POST_TYPES[initialType];   // från en flik: typen är redan vald
  const myGroups = s.myGroups;
  const tagOptions = useAsync(() => api.listCategories(), []);
  const spaceOptions = useAsync(async () => [...new Set([...DEFAULT_FUNCTIONS, ...(await api.listPosts({ kind: 'lokal' })).flatMap((p) => p.space_functions || [])])], []);
  const [loaded, setLoaded] = useState(!editing);
  const [type, setType] = useState(POST_TYPES[initialType] ? initialType : 'vanlig');
  const [slides, setSlides] = useState([]);
  const [caption, setCaption] = useState('');
  const [groupId, setGroupId] = useState(initialGroup && s.memberOf.has(initialGroup) ? initialGroup : myGroups[0]?.id || null);
  const [personal, setPersonal] = useState(false);
  const [tags, setTags] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [cost, setCost] = useState('gratis');
  const [price, setPrice] = useState('');
  const [finTotal, setFinTotal] = useState('');
  const [finMode, setFinMode] = useState('split');
  const [finEnd, setFinEnd] = useState(plusDays(30));
  const [hadFinance, setHadFinance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!editing) return;
    api.getPost(editId).then((p) => {
      if (p.author_id !== s.me.id) return go('/post/' + editId);
      setType(postType(p));
      setSlides(p.slides.map((x) => ({ key: x.id, id: x.id, image_url: x.image_url, preview: x.image_url, text: x.text || '' })));
      setCaption(p.caption || ''); setGroupId(p.group_id); setPersonal(!p.group_id);
      setTags(p.categories || []);
      setFunctions(p.space_functions || []); setCost(p.space_cost || 'gratis'); setPrice(p.space_price || '');
      if (p.fin_total != null) {
        setHadFinance(true); setFinTotal(String(p.fin_total)); setFinMode(p.fin_mode);
        setFinEnd(p.fin_expires_at ? p.fin_expires_at.slice(0, 10) : '');
      }
      setLoaded(true);
    }, (e) => setErr(e.message));
  }, [editId]);

  const noGroups = myGroups.length === 0;
  const isPersonal = personal || noGroups || !groupId;
  const update = (i, patch) => setSlides((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i) => setSlides((xs) => xs.filter((_, j) => j !== i));
  const move = (i, d) => setSlides((xs) => { const a = [...xs]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });
  function addFiles(e) {
    const files = [...e.target.files];
    setSlides((xs) => [...xs, ...files.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), text: '' }))]);
    e.target.value = '';
  }

  async function submit(e) {
    e.preventDefault(); setErr('');
    if (type === 'finansiering' && !hadFinance && finEnd && finEnd < plusDays(0)) return setErr('Slutdatumet har redan passerat.');
    setBusy(true);
    try {
      const payload = {
        type, groupId: isPersonal ? null : groupId, caption, tags,
        slides: slides.map(({ id, file, image_url, text }) => ({ id, file, image_url, text })),
        finance: type === 'finansiering'
          ? { total: Number(String(finTotal).replace(/\s/g, '')), mode: finMode, expiresAt: finEnd ? new Date(finEnd + 'T23:59:59').toISOString() : null }
          : null,
        space: type === 'lokal' ? { functions, cost, price } : null,
      };
      if (editing) { await api.updatePost(editId, payload); go('/post/' + editId); }
      else { const id = await api.createPost(payload); refreshBadges(); go('/post/' + id); }
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  if (!loaded) return html`<div class="page"><${Header} title="Redigera" back />${err ? html`<p class="empty error">${err}</p>` : html`<${Loading} />`}</div>`;

  return html`<div class="page">
    <${Header} title=${editing ? 'Redigera inlägg' : fixedType ? TYPE_TITLE[type] : 'Nytt inlägg'} back />
    <form class="form pad" onSubmit=${submit}>

      ${!fixedType && html`<fieldset class="field types">
        <legend class="label">Typ av post</legend>
        ${Object.entries(POST_TYPES).map(([k, label]) => html`<label class=${'radio type' + (type === k ? ' on' : '')} key=${k}>
          <input type="radio" name="type" value=${k} checked=${type === k} onChange=${() => setType(k)} />
          <span><strong>${label}</strong><small>${TYPE_HELP[k]}</small></span></label>`)}
      </fieldset>`}

      ${type === 'finansiering' && html`<section class="field fin-form">
        <${FinanceSteps} />
        <label>Totalbelopp (kr)<input inputmode="numeric" required value=${finTotal} disabled=${hadFinance} onInput=${(e) => setFinTotal(e.target.value)} placeholder="t.ex. 20000" /></label>
        <div class="label small">Hur ska pengarna fördelas?</div>
        <label class="radio"><input type="radio" name="mode" checked=${finMode === 'split'} disabled=${hadFinance} onChange=${() => setFinMode('split')} />
          <span>Flera kan söka delbelopp <small>Varje sökande anger hur mycket de behöver. Det som beviljas dras från potten.</small></span></label>
        <label class="radio"><input type="radio" name="mode" checked=${finMode === 'single'} disabled=${hadFinance} onChange=${() => setFinMode('single')} />
          <span>En mottagare får hela summan</span></label>
        <label>Ligger uppe till och med<input type="date" value=${finEnd} min=${plusDays(0)} onInput=${(e) => setFinEnd(e.target.value)} /></label>
      </section>`}

      ${type === 'lokal' && html`<section class="field">
        <div class="label">Vad kan lokalen användas till?</div>
        <${ChipPicker} options=${spaceOptions.data || DEFAULT_FUNCTIONS} selected=${functions} onChange=${setFunctions} placeholder="Något annat…" />
        <div class="label">Vad kostar det?</div>
        ${Object.entries(SPACE_COSTS).map(([k, label]) => html`<label class="radio" key=${k}>
          <input type="radio" name="cost" checked=${cost === k} onChange=${() => setCost(k)} /><span>${label}</span></label>`)}
        ${cost === 'kostar' && html`<label>Pris<input value=${price} onInput=${(e) => setPrice(e.target.value)} placeholder="t.ex. 200 kr per dag" /></label>`}
      </section>`}

      <section class="field">
        <div class="label">Vilken grupp gäller inlägget?</div>
        ${noGroups ? html`<div class="nudge">
            <strong>Du är inte med i någon grupp än.</strong>
            <p>Inlägg ska helst höra till en grupp. Gå med i en grupp eller skapa en ny.</p>
            <div class="btnrow"><a class="btn small" href="#/sok?flik=grupper">Hitta grupper</a><a class="btn small primary" href="#/ny-grupp?next=/ny">Skapa grupp</a></div>
          </div>`
        : html`<div class="group-pick">${myGroups.map((g) => html`<button type="button" key=${g.id}
            class=${'gp' + (!isPersonal && groupId === g.id ? ' on' : '')} onClick=${() => { setGroupId(g.id); setPersonal(false); }}>
            <${Avatar} src=${g.avatar_url} name=${g.name} size=${28} /><span>${g.name}</span></button>`)}</div>
          ${isPersonal
            ? html`<p class="hint">Personligt inlägg – det hör inte till någon grupp. <button type="button" class="link" onClick=${() => { setPersonal(false); setGroupId(groupId || myGroups[0].id); }}>Välj en grupp i stället</button></p>`
            : html`<button type="button" class="link subtle" onClick=${() => setPersonal(true)}>Posta utan grupp</button>`}`}
      </section>

      <section class="field">
        <div class="label">Bilder</div>
        ${slides.map((sl, i) => html`<div class="slide-edit" key=${sl.key}>
          <img src=${sl.preview} alt="" />
          <div class="se-main">
            <textarea rows="3" placeholder=${`Text till bild ${i + 1} (valfritt)`} value=${sl.text} onInput=${(e) => update(i, { text: e.target.value })}></textarea>
            <div class="se-actions">
              ${i > 0 && html`<button type="button" class="link" onClick=${() => move(i, -1)}>↑ Flytta upp</button>`}
              <button type="button" class="link danger" onClick=${() => remove(i)}>Ta bort</button>
            </div>
          </div></div>`)}
        <label class="addimg"><input type="file" accept="image/*" multiple hidden onChange=${addFiles} /><${Icon} name="image" />
          ${slides.length ? 'Lägg till fler bilder' : 'Lägg till bilder'}</label>
      </section>

      <label class="field">Text till inlägget
        <textarea rows="4" value=${caption} onInput=${(e) => setCaption(e.target.value)}
          placeholder=${{ finansiering: 'Vad kan pengarna sökas för? Vem kan söka?', lokal: 'Var ligger lokalen, när går den att använda och hur bokar man?' }[type] || 'Berätta vad ni gjort, vad ni lärt er eller vad ni behöver…'}></textarea></label>

      ${type === 'vanlig' && html`<section class="field">
        <div class="label">Kan andra lära sig något av det här?</div>
        <small class="muted">Lägg till ämnen så att andra som jobbar med samma sak hittar inlägget.</small>
        <${ChipPicker} options=${tagOptions.data || []} selected=${tags} onChange=${setTags} placeholder="Nytt ämne, t.ex. Solel…" />
      </section>`}

      ${err && html`<p class="error">${err}</p>`}
      <button class="btn primary block" disabled=${busy}>${busy ? 'Sparar…' : editing ? 'Spara ändringar' : 'Publicera'}</button>
    </form>
  </div>`;
}
