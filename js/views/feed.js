// Flödet, enskilt inlägg och skapa/redigera inlägg.
import { html, useState, useEffect } from '../lib.js';
import { api } from '../api/index.js';
import { APP_NAME } from '../config.js';
import { useStore, useAsync, go, attempt, refreshBadges } from '../store.js';
import { Icon, Avatar, Count, Header, PostCard, Comments, Loading, ErrorBox } from '../ui.js';
import { FINANCE, PAYOUT_BANK_LIMIT, POST_TYPES, postType, fmtKr } from '../util.js';

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

export function Home() {
  const s = useStore();
  const [tab, setTab] = useState('flode');
  const [cat, setCat] = useState(null);
  const groups = useAsync(() => api.listGroups(), []);
  const cats = useAsync(() => api.listCategories(), []);
  const posts = useAsync(() => api.listPosts({ resources: tab === 'resurser', category: tab === 'resurser' ? cat : null, feed: true }), [tab, cat]);
  const fresh = (g) => Date.now() - new Date(g.last_activity_at) < 24 * 3600e3;

  return html`<div class="page">
    <header class="topbar brand">
      <h1 class="logo">${APP_NAME}</h1>
      <div class="topbar-side right">
        ${s.badges.todos > 0 && html`<a class="iconbtn" href="#/att-gora" aria-label="Att göra"><${Icon} name="check" /><${Count} n=${s.badges.todos} /></a>`}
        <a class="iconbtn" href="#/meddelanden" aria-label="Meddelanden"><${Icon} name="chat" /><${Count} n=${s.badges.messages} /></a>
      </div>
    </header>
    ${api.mode === 'demo' && html`<div class="demo-banner">Demoläge – allt sparas bara i den här webbläsaren.
      <button class="link" onClick=${async () => { if (confirm('Återställ demodatan? Allt du skapat försvinner.')) { await api.resetDemo(); location.hash = '#/'; location.reload(); } }}>Återställ</button></div>`}

    <${InstallHint} />
    <div class="stories">
      <a class="story" href="#/ny-grupp"><span class="story-new">+</span><span class="story-name">Ny grupp</span></a>
      ${(groups.data || []).map((g) => html`<a class="story" href=${'#/grupp/' + g.id} key=${g.id}>
        <span class=${'story-ring' + (fresh(g) ? ' fresh' : '')}><${Avatar} src=${g.avatar_url} name=${g.name} size=${60} /></span>
        <span class="story-name">${g.name}</span></a>`)}
    </div>

    <div class="filterbar" role="tablist">
      <button role="tab" aria-selected=${tab === 'flode'} class=${tab === 'flode' ? 'on' : ''} onClick=${() => setTab('flode')}>Flöde</button>
      <button role="tab" aria-selected=${tab === 'resurser'} class=${tab === 'resurser' ? 'on' : ''} onClick=${() => setTab('resurser')}>Gemensamma resurser</button>
    </div>
    ${tab === 'resurser' && html`<div class="resource-bar">
      <div class="chips">
        <button class=${'chip' + (!cat ? ' on' : '')} onClick=${() => setCat(null)}>Alla</button>
        ${(cats.data || []).map((c) => html`<button class=${'chip' + (cat === c ? ' on' : '')} onClick=${() => setCat(c)}>${c}</button>`)}
      </div>
      <a class="chip-add" href="#/ny?typ=resurs" aria-label="Lägg upp en gemensam resurs" title="Lägg upp en gemensam resurs"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></a>
    </div>`}

    ${posts.loading && !posts.data ? html`<${Loading} />` : posts.error ? html`<${ErrorBox} error=${posts.error} />`
      : posts.data.length === 0 ? html`<p class="empty">Inget här än.</p>`
      : posts.data.map((p) => html`<${PostCard} key=${p.id} post=${p} onChange=${posts.reload} />`)}
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
  finansiering: 'Pengar som andra kan söka. Hamnar också under Gemensamma resurser → Finansiering.',
  resurs: 'Något andra kan ha nytta av: en byggmetod, en avloppslösning, ett sätt att producera energi, en lokal att låna … Hamnar också under fliken Gemensamma resurser, där man kan filtrera på kategori.',
};

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

export function Compose({ groupId: initialGroup, type: initialType, editId }) {
  const s = useStore();
  const editing = !!editId;
  const myGroups = s.myGroups;
  const cats = useAsync(() => api.listCategories(), []);
  const [loaded, setLoaded] = useState(!editing);
  const [type, setType] = useState(POST_TYPES[initialType] ? initialType : 'vanlig');
  const [slides, setSlides] = useState([]);
  const [caption, setCaption] = useState('');
  const [groupId, setGroupId] = useState(initialGroup && s.memberOf.has(initialGroup) ? initialGroup : myGroups[0]?.id || null);
  const [personal, setPersonal] = useState(false);
  const [selCats, setSelCats] = useState([]);
  const [extraCats, setExtraCats] = useState([]);
  const [newCat, setNewCat] = useState('');
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
      setSelCats((p.categories || []).filter((c) => c !== FINANCE));
      if (p.fin_total != null) {
        setHadFinance(true); setFinTotal(String(p.fin_total)); setFinMode(p.fin_mode);
        setFinEnd(p.fin_expires_at ? p.fin_expires_at.slice(0, 10) : '');
      }
      setLoaded(true);
    }, (e) => setErr(e.message));
  }, [editId]);

  const noGroups = myGroups.length === 0;
  const isPersonal = personal || noGroups || !groupId;
  const allCats = [...new Set([...(cats.data || []), ...extraCats])].filter((c) => c !== FINANCE);

  const update = (i, patch) => setSlides((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const remove = (i) => setSlides((xs) => xs.filter((_, j) => j !== i));
  const move = (i, d) => setSlides((xs) => { const a = [...xs]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });
  function addFiles(e) {
    const files = [...e.target.files];
    setSlides((xs) => [...xs, ...files.map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), text: '' }))]);
    e.target.value = '';
  }
  const toggleCat = (c) => setSelCats((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));
  function addCat() {
    const c = newCat.trim().replace(/^./, (m) => m.toUpperCase());
    if (!c || c.toLowerCase() === FINANCE.toLowerCase()) return setNewCat('');
    const existing = allCats.find((x) => x.toLowerCase() === c.toLowerCase()) || c;
    if (!allCats.includes(existing)) setExtraCats((xs) => [...xs, existing]);
    if (!selCats.includes(existing)) setSelCats((xs) => [...xs, existing]);
    setNewCat('');
  }

  async function submit(e) {
    e.preventDefault(); setErr('');
    if (type === 'finansiering' && !hadFinance && finEnd && finEnd < plusDays(0)) return setErr('Slutdatumet har redan passerat.');
    setBusy(true);
    try {
      const payload = {
        type, groupId: isPersonal ? null : groupId, caption, categories: selCats,
        slides: slides.map(({ id, file, image_url, text }) => ({ id, file, image_url, text })),
        finance: type === 'finansiering'
          ? { total: Number(String(finTotal).replace(/\s/g, '')), mode: finMode, expiresAt: finEnd ? new Date(finEnd + 'T23:59:59').toISOString() : null }
          : null,
      };
      if (editing) { await api.updatePost(editId, payload); go('/post/' + editId); }
      else { const id = await api.createPost(payload); refreshBadges(); go('/post/' + id); }
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }

  if (!loaded) return html`<div class="page"><${Header} title="Redigera" back />${err ? html`<p class="empty error">${err}</p>` : html`<${Loading} />`}</div>`;

  return html`<div class="page">
    <${Header} title=${editing ? 'Redigera inlägg' : 'Nytt inlägg'} back />
    <form class="form pad" onSubmit=${submit}>

      <fieldset class="field types">
        <legend class="label">Typ av post</legend>
        ${Object.entries(POST_TYPES).map(([k, label]) => html`<label class=${'radio type' + (type === k ? ' on' : '')} key=${k}>
          <input type="radio" name="type" value=${k} checked=${type === k} disabled=${hadFinance && k !== 'finansiering'} onChange=${() => setType(k)} />
          <span><strong>${label}</strong><small>${TYPE_HELP[k]}</small></span></label>`)}
        ${hadFinance && html`<small class="muted">Ett finansieringsinlägg kan inte byta typ.</small>`}
      </fieldset>

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

      ${type === 'resurs' && html`<section class="field">
        <div class="label small">Kategorier</div>
        <div class="chips wrap">${allCats.map((c) => html`<button type="button" class=${'chip' + (selCats.includes(c) ? ' on' : '')} onClick=${() => toggleCat(c)}>${c}</button>`)}</div>
        <div class="inline"><input value=${newCat} onInput=${(e) => setNewCat(e.target.value)} placeholder="Ny kategori…"
          onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); addCat(); } }} />
          <button type="button" class="btn small" onClick=${addCat} disabled=${!newCat.trim()}>Lägg till</button></div>
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
          placeholder=${type === 'finansiering' ? 'Vad kan pengarna sökas för? Vem kan söka?' : type === 'resurs' ? 'Beskriv resursen så att andra kan använda den…' : 'Berätta vad ni gjort, vad ni lärt er eller vad ni behöver…'}></textarea></label>

      ${err && html`<p class="error">${err}</p>`}
      <button class="btn primary block" disabled=${busy}>${busy ? 'Sparar…' : editing ? 'Spara ändringar' : 'Publicera'}</button>
    </form>
  </div>`;
}
