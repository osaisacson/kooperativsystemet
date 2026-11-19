// Gruppsida, höjdpunkter, gruppinställningar, ny grupp och välkomststeget.
import { html, useState } from '../lib.js';
import { api } from '../api/index.js';
import { useStore, useAsync, go, attempt, refreshMe } from '../store.js';
import { Icon, Avatar, Header, PostGrid, GroupRow, Modal, ImagePicker, Loading, ErrorBox } from '../ui.js';
import { prettyUrl, countryNames } from '../util.js';

// Land, region och stad för en grupp. Förslag hämtas från andra grupper.
function PlaceFields({ value, onChange }) {
  const groups = useAsync(() => api.listGroups(), []);
  const uniq = (k, filter) => [...new Set((groups.data || []).filter(filter || (() => true)).map((g) => g[k]).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'sv'));
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return html`<fieldset class="field place-fields">
    <legend class="label">Var finns gruppen?</legend>
    <label>Land<select value=${value.country} onChange=${set('country')}>
      ${countryNames().map((c) => html`<option value=${c}>${c}</option>`)}</select></label>
    <label>Region <small>(län, delstat …)</small><input list="dl-region" value=${value.region} onInput=${set('region')} placeholder="t.ex. Västra Götalands län" />
      <datalist id="dl-region">${uniq('region', (g) => g.country === value.country).map((r) => html`<option value=${r} />`)}</datalist></label>
    <label>Stad eller ort<input list="dl-city" required value=${value.city} onInput=${set('city')} placeholder="t.ex. Göteborg" />
      <datalist id="dl-city">${uniq('city', (g) => g.country === value.country && (!value.region || g.region === value.region)).map((c) => html`<option value=${c} />`)}</datalist></label>
    <label>Adress eller område <small>(för kartan)</small><input value=${value.address || ''} onInput=${set('address')} placeholder="t.ex. Ringön eller Järnmalmsgatan 4" /></label>
    <small class="muted">Staden används för att visa flödet per stad, region eller land. Adressen gör att gruppen hamnar rätt på kartan; utan adress placeras den mitt i staden.</small>
  </fieldset>`;
}
const placeText = (g) => [g.city, g.region, g.country].filter(Boolean).join(', ');

export function GroupView({ id }) {
  const s = useStore();
  const g = useAsync(() => api.getGroup(id), [id]);
  const posts = useAsync(() => api.listPosts({ groupId: id }), [id]);
  const [hl, setHl] = useState(null); // { highlight, edit }
  const [showMembers, setShowMembers] = useState(false);
  if (g.loading && !g.data) return html`<div class="page"><${Header} title="" back /><${Loading} /></div>`;
  if (g.error) return html`<div class="page"><${Header} title="" back /><${ErrorBox} error=${g.error} /></div>`;
  const grp = g.data;
  const member = s.memberOf.has(id);
  const admin = s.adminOf.has(id);
  const list = posts.data || [];
  const cover = (h) => list.find((p) => p.id === h.post_ids[0] && p.slides[0])?.slides[0].image_url;
  const reload = () => { g.reload(); posts.reload(); };

  async function join() { if (await attempt(() => api.joinGroup(id), `Välkommen till ${grp.name}!`)) { await refreshMe(); g.reload(); } }

  return html`<div class="page">
    <${Header} title=${grp.name} back right=${admin && html`<a class="iconbtn" href=${`#/grupp/${id}/installningar`} aria-label="Gruppinställningar"><${Icon} name="gear" /></a>`} />
    <div class="profile-head">
      <${Avatar} src=${grp.avatar_url} name=${grp.name} size=${84} />
      <div class="stats">
        <div><b>${list.length}</b><span>inlägg</span></div>
        <div><b>${grp.members.length}</b><span>medlemmar</span></div>
        <div><b>${grp.highlights.length}</b><span>höjdpunkter</span></div>
      </div>
    </div>
    <div class="profile-info"><strong>${grp.name}</strong>${placeText(grp) && html`<span class="group-place">${placeText(grp)}</span>`}${grp.description && html`<p>${grp.description}</p>`}
      ${grp.homepage && html`<a class="homepage" href=${grp.homepage} target="_blank" rel="noopener noreferrer">${prettyUrl(grp.homepage)}</a>`}</div>
    ${member && html`<div class="profile-actions">
      <a class="btn primary" href=${'#/ny?grupp=' + id}>Nytt inlägg</a>
    </div>`}

    <div class="members-head">
      ${!member && html`<button class="btn primary small" onClick=${join}>Gå med i gruppen</button>`}
      <button class="members-toggle" aria-expanded=${showMembers} onClick=${() => setShowMembers((x) => !x)}>
        Medlemmar <span class="muted">(${grp.members.length})</span> <span class="chev">${showMembers ? '▾' : '▸'}</span></button>
    </div>
    ${showMembers && html`<div class="row-scroll">
      ${grp.members.map((m) => html`<a class="mini" href=${'#/profil/' + m.user.id} key=${m.user.id}>
        <${Avatar} src=${m.user.avatar_url} name=${m.user.name} size=${52} />
        <span>${m.user.name.split(' ')[0]}</span>${m.role === 'admin' && html`<small class="role">admin</small>`}</a>`)}
    </div>`}

    ${(member || grp.highlights.length > 0) && html`<div class="label pad-x">Höjdpunkter</div>
    <div class="row-scroll highlights">
      ${member && html`<button class="mini" onClick=${() => setHl({ highlight: { title: '', post_ids: [] }, edit: true })}>
        <span class="hl-cover new">+</span><span>Ny</span></button>`}
      ${grp.highlights.map((h) => html`<button class="mini" key=${h.id} onClick=${() => setHl({ highlight: h, edit: false })}>
        <span class="hl-cover">${cover(h) ? html`<img src=${cover(h)} alt="" />` : h.title[0]}</span><span>${h.title}</span></button>`)}
    </div>`}

    <div class="grid-sep"></div>
    <${PostGrid} posts=${list} showAuthor empty="Gruppen har inga inlägg än." />

    ${hl && !hl.edit && html`<${Modal} title=${hl.highlight.title} onClose=${() => setHl(null)}>
      <${PostGrid} posts=${list.filter((p) => hl.highlight.post_ids.includes(p.id))} showAuthor empty="Inga inlägg i den här höjdpunkten än." />
      ${member && html`<button class="btn block" onClick=${() => setHl({ ...hl, edit: true })}>Redigera höjdpunkten</button>`}
    <//>`}
    ${hl && hl.edit && html`<${HighlightEditor} groupId=${id} highlight=${hl.highlight} posts=${list}
      onClose=${() => setHl(null)} onSaved=${() => { setHl(null); reload(); }} />`}
  </div>`;
}

function HighlightEditor({ groupId, highlight, posts, onClose, onSaved }) {
  const [title, setTitle] = useState(highlight.title);
  const [ids, setIds] = useState(highlight.post_ids);
  const toggle = (pid) => setIds((xs) => (xs.includes(pid) ? xs.filter((x) => x !== pid) : [...xs, pid]));
  async function save(e) {
    e.preventDefault();
    if (await attempt(() => api.saveHighlight(groupId, { id: highlight.id, title, post_ids: ids }), 'Höjdpunkten sparades')) onSaved();
  }
  async function del() {
    if (!confirm(`Ta bort höjdpunkten "${highlight.title}"? Inläggen finns kvar.`)) return;
    if (await attempt(() => api.deleteHighlight(highlight.id))) onSaved();
  }
  return html`<${Modal} title=${highlight.id ? 'Redigera höjdpunkt' : 'Ny höjdpunkt'} onClose=${onClose}>
    <form class="form" onSubmit=${save}>
      <label>Namn<input required value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder="t.ex. Bygget, Recept, Bidrag" /></label>
      <div class="label small">Välj inlägg (${ids.length} valda)</div>
      ${posts.length === 0 ? html`<p class="muted">Gruppen har inga inlägg än.</p>` : html`<div class="grid pick">
        ${posts.map((p) => html`<button type="button" key=${p.id} class=${'tile' + (ids.includes(p.id) ? ' picked' : '')} onClick=${() => toggle(p.id)}>
          ${p.slides[0] ? html`<img src=${p.slides[0].image_url} alt="" />` : html`<span class="tile-text">${p.caption}</span>`}
          ${ids.includes(p.id) && html`<span class="tick">${ids.indexOf(p.id) + 1}</span>`}</button>`)}</div>`}
      <button class="btn primary block">Spara</button>
      ${highlight.id && html`<button type="button" class="link danger center" onClick=${del}>Ta bort höjdpunkten</button>`}
    </form><//>`;
}

export function GroupSettings({ id }) {
  const s = useStore();
  const g = useAsync(() => api.getGroup(id), [id]);
  const [name, setName] = useState(null);
  const [desc, setDesc] = useState(null);
  const [homepage, setHomepage] = useState(null);
  const [where, setWhere] = useState(null);
  const [file, setFile] = useState(null);
  if (g.loading && !g.data) return html`<div class="page"><${Header} title="Inställningar" back /><${Loading} /></div>`;
  if (g.error) return html`<div class="page"><${Header} title="Inställningar" back /><${ErrorBox} error=${g.error} /></div>`;
  const grp = g.data;
  if (!s.adminOf.has(id)) return html`<div class="page"><${Header} title="Inställningar" back /><p class="empty">Bara gruppens admins kan ändra inställningarna.</p></div>`;

  async function save(e) {
    e.preventDefault();
    if (await attempt(() => api.updateGroup(id, { name: name ?? grp.name, description: desc ?? grp.description, homepage: homepage ?? grp.homepage ?? '', ...(where || { country: grp.country || 'Sverige', region: grp.region || '', city: grp.city || '', address: grp.address || '' }), avatarFile: file }), 'Sparat')) {
      await refreshMe(); g.reload();
    }
  }
  async function act(fn, msg) { if (await attempt(fn, msg)) { await refreshMe(); g.reload(); } }

  return html`<div class="page">
    <${Header} title="Gruppinställningar" back />
    <form class="form pad" onSubmit=${save}>
      <${ImagePicker} current=${grp.avatar_url} name=${grp.name} onFile=${setFile} label="Byt gruppbild" />
      <label>Namn<input required value=${name ?? grp.name} onInput=${(e) => setName(e.target.value)} /></label>
      <label>Beskrivning<textarea rows="3" value=${desc ?? grp.description} onInput=${(e) => setDesc(e.target.value)}></textarea></label>
      <label>Hemsida <small>(valfri)</small><input inputmode="url" autocapitalize="off" value=${homepage ?? grp.homepage ?? ''} onInput=${(e) => setHomepage(e.target.value)} placeholder="https://…" /></label>
      <${PlaceFields} value=${where || { country: grp.country || 'Sverige', region: grp.region || '', city: grp.city || '', address: grp.address || '' }} onChange=${setWhere} />
      <button class="btn primary block">Spara</button>
    </form>

    <div class="label pad-x">Medlemmar och admins</div>
    <div class="list">
      ${grp.members.map((m) => {
        const me = m.user.id === s.me.id;
        return html`<div class="row" key=${m.user.id}>
          <${Avatar} src=${m.user.avatar_url} name=${m.user.name} size=${40} />
          <span class="row-main"><strong>${m.user.name}${me ? ' (du)' : ''}</strong><small class="muted">${m.role === 'admin' ? 'Admin' : 'Medlem'}</small></span>
          <span class="btnrow">
            ${m.role === 'admin'
              ? html`<button class="btn small" onClick=${() => act(() => api.setMemberRole(id, m.user.id, 'member'), `${m.user.name} är inte längre admin`)}>Ta bort som admin</button>`
              : html`<button class="btn small primary" onClick=${() => act(() => api.setMemberRole(id, m.user.id, 'admin'), `${m.user.name} är nu admin`)}>Gör till admin</button>`}
            ${!me && html`<button class="btn small danger" onClick=${() => confirm(`Ta bort ${m.user.name} ur gruppen?`) && act(() => api.removeMember(id, m.user.id), 'Borttagen ur gruppen')}>Ta bort</button>`}
          </span></div>`;
      })}
    </div>
    <div class="pad danger-zone">
      <button class="btn danger block" onClick=${async () => {
        if (!confirm(`Ta bort ${grp.name}? Gruppens alla inlägg, kommentarer och höjdpunkter tas också bort. Det går inte att ångra.`)) return;
        if (await attempt(() => api.deleteGroup(id), 'Gruppen togs bort')) { await refreshMe(); go('/'); }
      }}>Ta bort gruppen</button>
    </div>
    <p class="hint pad">Den som skapar en grupp blir admin. Admins kan ändra namn, beskrivning och bild, utse fler admins och ta bort medlemmar. Alla medlemmar kan skapa och redigera gruppens höjdpunkter.
      Om sista admin lämnar blir den som varit med längst admin. Om ingen admin varit inloggad på ett år mejlas admins, och efter 30 dagar tar den medlem som varit med längst över.</p>
  </div>`;
}

export function NewGroup({ next }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [homepage, setHomepage] = useState('');
  const [where, setWhere] = useState({ country: 'Sverige', region: '', city: '', address: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const g = await attempt(() => api.createGroup({ name, description: desc, homepage, ...where, avatarFile: file }), 'Gruppen är skapad – du är admin');
    setBusy(false);
    if (g) { await refreshMe(); go(next ? (next === '/ny' ? '/ny?grupp=' + g.id : next) : '/grupp/' + g.id); }
  }
  return html`<div class="page">
    <${Header} title="Ny grupp" back />
    <form class="form pad" onSubmit=${submit}>
      <${ImagePicker} name=${name} onFile=${setFile} label="Välj gruppbild" />
      <label>Namn<input required value=${name} onInput=${(e) => setName(e.target.value)} placeholder="t.ex. Gråvattengruppen Gottsunda" /></label>
      <label>Beskrivning<textarea rows="3" value=${desc} onInput=${(e) => setDesc(e.target.value)} placeholder="Vad gör ni? Vilka är ni?"></textarea></label>
      <label>Hemsida <small>(valfri)</small><input inputmode="url" autocapitalize="off" value=${homepage} onInput=${(e) => setHomepage(e.target.value)} placeholder="https://…" /></label>
      <${PlaceFields} value=${where} onChange=${setWhere} />
      <p class="hint">Du blir gruppens admin och kan lägga till fler admins under gruppinställningar. Alla kan gå med i gruppen.</p>
      <button class="btn primary block" disabled=${busy}>${busy ? 'Skapar…' : 'Skapa grupp'}</button>
    </form>
  </div>`;
}

export function Welcome() {
  const s = useStore();
  const groups = useAsync(() => api.listGroups(), []);
  return html`<div class="page">
    <div class="pad welcome">
      <h1>Välkommen, ${s.me.name.split(' ')[0]}!</h1>
      <p>Gå med i de grupper du är med i, eller skapa en ny. Det går att ändra senare.</p>
      <a class="btn block" href="#/ny-grupp?next=/valkommen">+ Skapa en ny grupp</a>
    </div>
    <div class="list">
      ${groups.loading && !groups.data ? html`<${Loading} />` : (groups.data || []).map((g) => html`<${GroupRow} key=${g.id} group=${g} onChange=${groups.reload} />`)}
    </div>
    <div class="pad"><button class=${'btn block ' + (s.memberOf.size ? 'primary' : '')} onClick=${() => go('/')}>${s.memberOf.size ? 'Klar – till flödet' : 'Hoppa över så länge'}</button></div>
  </div>`;
}
