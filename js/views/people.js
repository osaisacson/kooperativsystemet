// Inloggning/registrering, sök, profil och redigera profil.
import { html, useState, useEffect } from '../lib.js';
import { api } from '../api/index.js';
import { APP_NAME } from '../config.js';
import { useStore, useAsync, go, attempt, refreshMe, setState, toast } from '../store.js';
import { Avatar, Header, PostGrid, GroupRow, UserRow, ImagePicker, Loading, ErrorBox } from '../ui.js';

export function AuthView() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'login') { await api.signIn({ email, password }); go('/'); }
      else if (mode === 'reset') {
        await api.requestPasswordReset(email);
        setInfo('Om det finns ett konto med den adressen har vi skickat ett mejl med en länk. Öppna länken för att välja ett nytt lösenord.');
        return;
      } else {
        const r = await api.signUp({ email, password, name, nickname, avatarFile: file });
        if (r.needsConfirmation) { setInfo('Nästan klart! Vi har skickat ett mejl – klicka på länken i det och logga sedan in här.'); setMode('login'); }
        else go('/valkommen');
      }
      await refreshMe();
    } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  const signup = mode === 'signup';
  const reset = mode === 'reset';
  const switchTo = (m) => { setMode(m); setErr(''); setInfo(''); };
  return html`<div class="auth">
    <img class="auth-logo" src="icon.svg" alt="" width="72" height="72" />
    <h1 class="logo big">${APP_NAME}</h1>
    <form class="form card" onSubmit=${submit}>
      ${reset && html`<p><strong>Glömt lösenordet?</strong><br /><span class="muted">Skriv din e-postadress så skickar vi en länk där du kan välja ett nytt.</span></p>`}
      ${signup && html`<${ImagePicker} name=${name} onFile=${setFile} label="Välj profilbild" />
        <label>Namn<input required autocomplete="name" value=${name} onInput=${(e) => setName(e.target.value)} placeholder="För- och efternamn" /></label>
        <label>Smeknamn <small>(valfritt)</small><input autocomplete="nickname" value=${nickname} onInput=${(e) => setNickname(e.target.value)} /></label>`}
      <label>E-post<input required type="email" autocomplete="email" value=${email} onInput=${(e) => setEmail(e.target.value)} /></label>
      ${!reset && html`<label>Lösenord<input required type="password" minlength="6" autocomplete=${signup ? 'new-password' : 'current-password'} value=${password} onInput=${(e) => setPassword(e.target.value)} /></label>`}
      ${mode === 'login' && html`<button type="button" class="link small forgot" onClick=${() => switchTo('reset')}>Glömt lösenordet?</button>`}
      ${info && html`<p class="info">${info}</p>`}
      ${err && html`<p class="error">${err}</p>`}
      <button class="btn primary block" disabled=${busy}>${busy ? 'Vänta…' : signup ? 'Skapa konto' : reset ? 'Skicka länk' : 'Logga in'}</button>
    </form>
    ${reset
      ? html`<p class="center"><button class="link strong" onClick=${() => switchTo('login')}>Tillbaka till inloggningen</button></p>`
      : html`<p class="center">${signup ? 'Har du redan ett konto? ' : 'Ny här? '}
          <button class="link strong" onClick=${() => switchTo(signup ? 'login' : 'signup')}>${signup ? 'Logga in' : 'Skapa konto'}</button></p>`}
    ${api.mode === 'demo' && html`<p class="hint center">Demoläge: konton och inlägg sparas bara i den här webbläsaren.</p>`}
  </div>`;
}

const TABS = [['inlagg', 'Inlägg'], ['personer', 'Personer'], ['grupper', 'Grupper']];

export function Search({ tab: initialTab }) {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [tab, setTab] = useState(TABS.some(([k]) => k === initialTab) ? initialTab : 'inlagg');
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t); }, [q]);
  const res = useAsync(() => (tab === 'inlagg' ? api.listPosts({ q: dq }) : tab === 'personer' ? api.listUsers(dq) : api.listGroups(dq)), [tab, dq]);
  const placeholder = { inlagg: 'Sök bland alla inlägg', personer: 'Sök bland alla personer', grupper: 'Sök bland alla grupper' }[tab];
  return html`<div class="page">
    <div class="searchbar"><input type="search" value=${q} onInput=${(e) => setQ(e.target.value)} placeholder=${placeholder} aria-label=${placeholder} /></div>
    <div class="tabs" role="tablist">${TABS.map(([k, label]) => html`<button role="tab" aria-selected=${tab === k} class=${tab === k ? 'on' : ''} onClick=${() => setTab(k)}>${label}</button>`)}</div>
    ${res.loading && !res.data ? html`<${Loading} />` : res.error ? html`<${ErrorBox} error=${res.error} />`
      : tab === 'inlagg' ? html`<${PostGrid} posts=${res.data} showAuthor empty="Inga inlägg hittades." />`
      : res.data.length === 0 ? html`<p class="empty">Inget hittades.</p>`
      : html`<div class="list">${tab === 'personer'
          ? res.data.map((u) => html`<${UserRow} key=${u.id} user=${u} />`)
          : [html`<a class="row" href="#/ny-grupp"><span class="avatar plus">+</span><span class="row-main"><strong>Skapa ny grupp</strong></span></a>`,
             ...res.data.map((g) => html`<${GroupRow} key=${g.id} group=${g} onChange=${res.reload} />`)]}</div>`}
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
    <div class="profile-head">
      <${Avatar} src=${user.avatar_url} name=${user.name} size=${84} />
      <div class="stats">
        <div><b>${posts.data?.length ?? '–'}</b><span>inlägg</span></div>
        <div><b>${user.groups.length}</b><span>grupper</span></div>
      </div>
    </div>
    <div class="profile-info"><strong>${user.name}</strong>${user.nickname && html` <span class="muted">"${user.nickname}"</span>`}</div>
    ${user.groups.length > 0 && html`<div class="chips wrap pad-x">${user.groups.map((g) => html`<a class="chip" href=${'#/grupp/' + g.id} key=${g.id}>
      <${Avatar} src=${g.avatar_url} name=${g.name} size=${18} /> ${g.name}${g.role === 'admin' ? ' · admin' : ''}</a>`)}</div>`}
    <div class="profile-actions">
      ${isMe
        ? html`<a class="btn" href="#/redigera-profil">Redigera profil</a><button class="btn" onClick=${logout}>Logga ut</button>`
        : html`<a class="btn primary" href=${'#/meddelanden/' + id}>Skicka meddelande</a>`}
    </div>
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
    <h1 class="logo big">${APP_NAME}</h1>
    <form class="form card" onSubmit=${submit}>
      <p><strong>Välj ett nytt lösenord</strong></p>
      <label>Nytt lösenord<input required type="password" minlength="6" autocomplete="new-password" value=${pw} onInput=${(e) => setPw(e.target.value)} autofocus /></label>
      ${err && html`<p class="error">${err}</p>`}
      <button class="btn primary block" disabled=${busy}>${busy ? 'Sparar…' : 'Spara lösenordet'}</button>
    </form>
  </div>`;
}

export function EditProfile() {
  const s = useStore();
  const [name, setName] = useState(s.me.name);
  const [nickname, setNickname] = useState(s.me.nickname || '');
  const [file, setFile] = useState(null);
  async function save(e) {
    e.preventDefault();
    if (await attempt(() => api.updateProfile({ name, nickname, avatarFile: file }), 'Profilen sparades')) { await refreshMe(); go('/profil/' + s.me.id); }
  }
  return html`<div class="page">
    <${Header} title="Redigera profil" back />
    <form class="form pad" onSubmit=${save}>
      <${ImagePicker} current=${s.me.avatar_url} name=${s.me.name} onFile=${setFile} label="Byt profilbild" />
      <label>Namn<input required value=${name} onInput=${(e) => setName(e.target.value)} /></label>
      <label>Smeknamn <small>(valfritt)</small><input value=${nickname} onInput=${(e) => setNickname(e.target.value)} /></label>
      <button class="btn primary block">Spara</button>
    </form>
  </div>`;
}
