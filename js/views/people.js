// Inloggning/registrering, sök, profil och redigera profil.
import { html, useState, useEffect } from '../lib.js';
import { api } from '../api/index.js';
import { APP_NAME, AUTH_PROVIDERS, VAPID_PUBLIC_KEY } from '../config.js';
import { useStore, useAsync, go, attempt, refreshMe, refreshBadges, setState, toast } from '../store.js';
import { Avatar, Header, PostGrid, GroupRow, UserRow, ImagePicker, Loading, ErrorBox } from '../ui.js';
import { HomePlaceFields, checkHome, emptyHome } from './place.js';

const PROVIDERS = {
  google: { label: 'Fortsätt med Google', icon: '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>' },
  apple: { label: 'Fortsätt med Apple', icon: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/></svg>' },
};

function ProviderButtons() {
  const list = api.mode === 'supabase' ? AUTH_PROVIDERS.filter((p) => PROVIDERS[p]) : [];
  if (!list.length) return null;
  return html`<div class="providers">
    ${list.map((p) => html`<button type="button" class=${'btn block provider ' + p} key=${p}
      onClick=${() => attempt(() => api.signInWithProvider(p))}>
      <span dangerouslySetInnerHTML=${{ __html: PROVIDERS[p].icon }}></span>${PROVIDERS[p].label}</button>`)}
    <div class="divider"><span>eller med e-post och lösenord</span></div>
  </div>`;
}

export function AuthView() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [file, setFile] = useState(null);
  const [home, setHome] = useState(emptyHome);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'login') { await api.signIn({ email, password }); go('/'); }
      else if (mode === 'reset') {
        await api.requestPasswordReset(email);
        setInfo('Om det finns ett konto med den adressen har vi skickat ett mejl med en länk. Hittar du det inte? Titta i skräpposten.');
        return;
      } else {
        const bad = checkHome(home);
        if (bad) { setErr(bad); return; }
        const r = await api.signUp({ email, password, name, nickname, avatarFile: file, home });
        if (r.needsConfirmation) { setInfo('Nästan klart! Vi har skickat ett mejl – klicka på länken i det och logga sedan in här.'); setMode('login'); }
        else go('/valkommen');
      }
      await refreshMe();
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const signup = mode === 'signup';
  const places = useAsync(() => (signup ? api.listPlaces() : Promise.resolve([])), [signup]);
  const reset = mode === 'reset';
  const switchTo = (m) => { setMode(m); setErr(''); setInfo(''); };
  return html`<div class="auth">
    <img class="auth-logo" src="icon.svg" alt="" width="72" height="72" />
    <h1 class="logo big">SOS<small class="logo-sub">Småskaliga Omkonfigurationer av Samhället</small></h1>
    <form class="form card" onSubmit=${submit}>
      ${!reset && html`<${ProviderButtons} />`}
      ${reset && html`<p><strong>Glömt lösenordet?</strong><br /><span class="muted">Skriv din e-postadress så skickar vi en länk där du kan välja ett nytt.</span></p>`}
      ${signup && html`<${ImagePicker} name=${name} onFile=${setFile} label="Välj profilbild" />
        <label>Namn<input required autocomplete="name" value=${name} onInput=${(e) => setName(e.target.value)} placeholder="För- och efternamn" /></label>
        <label>Smeknamn <small>(valfritt)</small><input autocomplete="nickname" value=${nickname} onInput=${(e) => setNickname(e.target.value)} /></label>`}
      <label>E-post<input required type="email" autocomplete="email" value=${email} onInput=${(e) => setEmail(e.target.value)} /></label>
      ${!reset && html`<label>Lösenord<input required type="password" minlength="6" autocomplete=${signup ? 'new-password' : 'current-password'} value=${password} onInput=${(e) => setPassword(e.target.value)} /></label>`}
      ${signup && html`<${HomePlaceFields} value=${home} onChange=${setHome} groups=${places.data} />`}
      ${mode === 'login' && html`<button type="button" class="link small forgot" onClick=${() => switchTo('reset')}>Glömt lösenordet?</button>`}
      ${info && html`<p class="info">${info}</p>`}
      ${err && html`<p class="error">${err}</p>`}
      <button class="btn primary block" disabled=${busy}>${busy ? 'Vänta…' : signup ? 'Skapa konto' : reset ? 'Skicka länk' : 'Logga in'}</button>
    </form>
    ${reset
      ? html`<p class="center"><button class="link strong" onClick=${() => switchTo('login')}>Tillbaka till inloggningen</button></p>`
      : html`<p class="center">${signup ? 'Har du redan ett konto? ' : 'Ny här? '}
          <button class="link strong" onClick=${() => switchTo(signup ? 'login' : 'signup')}>${signup ? 'Logga in' : 'Skapa konto'}</button></p>`}
    <p class="hint center"><a href="integritet.html">Integritet</a></p>
    ${api.mode === 'demo' && html`<p class="hint center">Demoläge: konton och inlägg sparas bara i den här webbläsaren.</p>`}
  </div>`;
}

const TABS = [['inlagg', 'Inlägg'], ['personer', 'Personer'], ['grupper', 'Grupper']];

export function Search({ tab: initialTab }) {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [tab, setTab] = useState(TABS.some(([k]) => k === initialTab) ? initialTab : 'inlagg');
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  // Resultaten märks med vilken flik de hör till, så att gamla resultat aldrig ritas i fel flik.
  const res = useAsync(async () => ({
    tab, items: await (tab === 'inlagg' ? api.listPosts({ q: dq }) : tab === 'personer' ? api.listUsers(dq) : api.listGroups(dq)),
  }), [tab, dq]);
  const placeholder = { inlagg: 'Sök bland alla inlägg', personer: 'Sök bland alla personer', grupper: 'Sök bland alla grupper' }[tab];
  const items = res.data?.tab === tab ? res.data.items : null;
  return html`<div class="page">
    <div class="searchbar"><input type="search" value=${q} onInput=${(e) => setQ(e.target.value)} placeholder=${placeholder} aria-label=${placeholder} /></div>
    <div class="tabs" role="tablist">${TABS.map(([k, label]) => html`<button role="tab" aria-selected=${tab === k} class=${tab === k ? 'on' : ''} onClick=${() => setTab(k)}>${label}</button>`)}</div>
    ${res.error ? html`<${ErrorBox} error=${res.error} />` : !items ? html`<${Loading} />`
      : tab === 'inlagg' ? html`<${PostGrid} posts=${items} showAuthor empty="Inga inlägg hittades." />`
      : tab === 'personer'
        ? (items.length ? html`<div class="list">${items.map((u) => html`<${UserRow} key=${u.id} user=${u} />`)}</div>` : html`<p class="empty">Inget hittades.</p>`)
        : html`<div class="list">
            <a class="row" href="#/ny-grupp"><span class="avatar plus">+</span><span class="row-main"><strong>Skapa ny grupp</strong></span></a>
            ${items.map((g) => html`<${GroupRow} key=${g.id} group=${g} onChange=${res.reload} />`)}</div>`}
  </div>`;
}

// Gruppernas ikoner i en rad som går att scrolla åt höger; fler laddas in när man närmar sig slutet.
function GroupIcons({ groups }) {
  const [shown, setShown] = useState(24);
  const more = (e) => {
    const el = e.currentTarget;
    if (shown < groups.length && el.scrollLeft + el.clientWidth > el.scrollWidth - 120) setShown((n) => n + 24);
  };
  return html`<div class="group-icons" onScroll=${more} aria-label="Grupper">
    ${groups.slice(0, shown).map((g) => html`<a href=${'#/grupp/' + g.id} key=${g.id} title=${g.name + (g.role === 'admin' ? ' (admin)' : '')}>
      <${Avatar} src=${g.avatar_url} name=${g.name} size=${44} /></a>`)}
  </div>`;
}

export function Profile({ id }) {
  const s = useStore();
  const u = useAsync(() => api.getUser(id), [id]);
  const posts = useAsync(() => api.listPosts({ authorId: id }), [id]);
  const isMe = id === s.me.id;
  if (u.loading && !u.data) return html`<div class="page"><${Header} title="" back=${!isMe} /><${Loading} /></div>`;
  if (u.error) return html`<div class="page"><${Header} title="" back /><${ErrorBox} error=${u.error} /></div>`;
  const user = u.data;
  async function logout() { await api.signOut(); await refreshMe(); go('/'); }
  return html`<div class="page">
    <${Header} title=${user.name} back=${!isMe} />
    ${user.groups.length > 0 && html`<${GroupIcons} groups=${user.groups} />`}
    <div class="profile-head">
      <${Avatar} src=${user.avatar_url} name=${user.name} size=${84} />
      <div class="stats">
        <div><b>${posts.data?.length ?? '–'}</b><span>inlägg</span></div>
        <div><b>${user.groups.length}</b><span>grupper</span></div>
      </div>
    </div>
    <div class="profile-info"><strong>${user.name}</strong>${user.nickname && html` <span class="muted">"${user.nickname}"</span>`}</div>
    <div class="profile-actions">
      ${isMe
        ? html`<a class="btn" href="#/redigera-profil">Redigera profil</a><button class="btn" onClick=${logout}>Logga ut</button>`
        : html`<a class="btn primary" href=${'#/meddelanden/' + id}>Skicka meddelande</a>`}
    </div>
    ${isMe && html`<${PushSetting} />`}
    ${isMe && user.groups.length === 0 && html`<div class="nudge pad-x">Du är inte med i någon grupp än. <a href="#/valkommen">Hitta eller skapa en grupp</a></div>`}
    <div class="grid-sep"></div>
    ${posts.data ? html`<${PostGrid} posts=${posts.data} />` : html`<${Loading} />`}
  </div>`;
}

// Visas när man kommer från länken i "återställ lösenord"-mejlet.
export function NewPassword() {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api.setNewPassword(pw);
      setState({ recovering: false });
      toast('Lösenordet är ändrat');
      go('/');
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return html`<div class="auth">
    <img class="auth-logo" src="icon.svg" alt="" width="72" height="72" />
    <h1 class="logo big">SOS<small class="logo-sub">Småskaliga Omkonfigurationer av Samhället</small></h1>
    <form class="form card" onSubmit=${submit}>
      <p><strong>Välj ett nytt lösenord</strong></p>
      <label>Nytt lösenord<input required type="password" minlength="6" autocomplete="new-password" value=${pw} onInput=${(e) => setPw(e.target.value)} autofocus /></label>
      ${err && html`<p class="error">${err}</p>`}
      <button class="btn primary block" disabled=${busy}>${busy ? 'Sparar…' : 'Spara lösenordet'}</button>
    </form>
  </div>`;
}

// Notiser + siffra på appikonen, även när appen är stängd (push). På iPhone fungerar det bara i appen sparad på hemskärmen.
const urlB64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
function PushSetting() {
  const supported = api.mode === 'supabase' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const ios = /iphone|ipad/i.test(navigator.userAgent);
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const [state, setState2] = useState('laddar');
  useEffect(() => {
    if (!supported) return setState2('nej');
    navigator.serviceWorker.ready.then((r) => r.pushManager.getSubscription()).then((s) => setState2(s && Notification.permission === 'granted' ? 'på' : Notification.permission === 'denied' ? 'nekad' : 'av'));
  }, []);
  if (!supported) return ios && !standalone ? html`<div class="nudge badge-setting"><span>Spara appen på hemskärmen för att kunna få notiser och en siffra på appikonen.</span></div>` : null;
  async function on() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return setState2(perm === 'denied' ? 'nekad' : 'av');
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(VAPID_PUBLIC_KEY) });
      await api.savePushSubscription(sub);
      setState2('på'); toast('Notiser är på'); refreshBadges();
    } catch (e) { toast('Det gick inte att slå på notiser: ' + e.message); }
  }
  async function off() {
    const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
    if (sub) { await api.removePushSubscription(sub.endpoint).catch(() => {}); await sub.unsubscribe(); }
    setState2('av'); toast('Notiser är avstängda');
  }
  if (state === 'laddar') return null;
  return html`<div class="nudge badge-setting">
    ${state === 'på' ? html`<span>Notiser är på: du får besked om nya meddelanden och ansökningar, och en siffra på appikonen.</span><button class="btn small" onClick=${off}>Stäng av</button>`
      : state === 'nekad' ? html`<span>Notiser är blockerade för appen. Slå på dem i telefonens inställningar för appen.</span>`
      : html`<span>Vill du få notiser om nya meddelanden och ansökningar, och en siffra på appikonen?</span><button class="btn small primary" onClick=${on}>Slå på</button>`}
  </div>`;
}

export function EditProfile() {
  const s = useStore();
  const [name, setName] = useState(s.me.name);
  const [nickname, setNickname] = useState(s.me.nickname || '');
  const [file, setFile] = useState(null);
  const [home, setHome] = useState(() => (s.me.home ? { ...emptyHome(), ...s.me.home } : emptyHome()));
  const groups = useAsync(() => api.listGroups(), []);
  async function save(e) {
    e.preventDefault();
    const changed = home.country && JSON.stringify(home) !== JSON.stringify(s.me.home ? { ...emptyHome(), ...s.me.home } : emptyHome());
    if (changed && checkHome(home)) return toast(checkHome(home));
    if (await attempt(() => api.updateProfile({ name, nickname, avatarFile: file, home: changed ? home : undefined }), 'Profilen sparades')) {
      await refreshMe(); go('/profil/' + s.me.id);
    }
  }
  async function leave(g) {
    const msg = g.role === 'admin'
      ? `Lämna ${g.name}? Är du gruppens enda admin blir den som varit med längst admin.`
      : `Lämna ${g.name}?`;
    if (confirm(msg) && await attempt(() => api.leaveGroup(g.id), `Du har lämnat ${g.name}`)) await refreshMe();
  }
  return html`<div class="page">
    <${Header} title="Redigera profil" back />
    <form class="form pad" onSubmit=${save}>
      <${ImagePicker} current=${s.me.avatar_url} name=${s.me.name} onFile=${setFile} label="Byt profilbild" />
      <label>Namn<input required value=${name} onInput=${(e) => setName(e.target.value)} /></label>
      <label>Smeknamn <small>(valfritt)</small><input value=${nickname} onInput=${(e) => setNickname(e.target.value)} /></label>
      <${HomePlaceFields} value=${home} onChange=${setHome} groups=${groups.data} />
      <small class="muted">Din plats syns bara för dig. Den bestämmer var appen startar.</small>
      <button class="btn primary block">Spara</button>
    </form>
    ${s.myGroups.length > 0 && html`<div class="label pad-x">Dina grupper</div>
    <div class="list">${s.myGroups.map((g) => html`<div class="row" key=${g.id}>
      <a href=${'#/grupp/' + g.id}><${Avatar} src=${g.avatar_url} name=${g.name} size=${40} /></a>
      <a class="row-main" href=${'#/grupp/' + g.id}><strong>${g.name}</strong><small class="muted">${g.role === 'admin' ? 'Admin' : 'Medlem'}</small></a>
      <button class="btn small" onClick=${() => leave(g)}>Lämna</button></div>`)}</div>`}
  </div>`;
}
