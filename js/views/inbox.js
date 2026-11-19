// Notiser, att göra-listan och meddelanden (enkla, utan lästkvitton eller andra beroendeskapande finesser).
import { html, useState, useEffect, useRef } from '../lib.js';
import { api } from '../api/index.js';
import { useStore, useAsync, go, attempt, refreshBadges } from '../store.js';
import { Icon, Avatar, Header, UserRow, Loading, ErrorBox, linkify } from '../ui.js';
import { fmtKr, timeAgo } from '../util.js';

export function Notifications() {
  const n = useAsync(async () => {
    const list = await api.listNotifications();
    api.markNotificationsRead().then(refreshBadges);
    return list;
  }, []);
  return html`<div class="page">
    <${Header} title="Notiser" back />
    ${n.loading && !n.data ? html`<${Loading} />` : n.error ? html`<${ErrorBox} error=${n.error} />`
      : n.data.length === 0 ? html`<p class="empty">Inga notiser än. Här hamnar kommentarer, ansökningar och beslut.</p>`
      : html`<div class="list">${n.data.map((x) => html`<a key=${x.id} class=${'row notif' + (x.read ? '' : ' unread')}
          href=${x.post_id ? '#/post/' + x.post_id : x.group_id ? '#/grupp/' + x.group_id : '#/'}>
          ${x.actor ? html`<${Avatar} src=${x.actor.avatar_url} name=${x.actor.name} size=${40} />` : html`<span class="avatar sys">★</span>`}
          <span class="row-main"><span>${x.actor && html`<strong>${x.actor.name}</strong> `}${x.body}</span>
            <small class="muted">${timeAgo(x.created_at)}</small></span></a>`)}</div>`}
  </div>`;
}

export function Todos() {
  const t = useAsync(() => api.listTodos(), []);
  async function pay(x) {
    if (!confirm(`Har du skickat ${fmtKr(x.applied_amount)} till ${x.group?.name || x.author.name}?`)) return;
    if (await attempt(() => api.markPaid(x.id), 'Markerat som utbetalt')) { refreshBadges(); t.reload(); }
  }
  const open = (t.data || []).filter((x) => x.status === 'granted');
  const done = (t.data || []).filter((x) => x.status === 'paid');
  const item = (x) => {
    const bank = x.payout?.startsWith('Bankkonto');
    const to = x.payout?.replace(/^(Swish|Bankkonto):\s*/, '') || '(uppgift saknas)';
    return html`<label class=${'todo' + (x.status === 'paid' ? ' done' : '')} key=${x.id}>
      <input type="checkbox" checked=${x.status === 'paid'} disabled=${x.status === 'paid'} onChange=${(e) => { e.target.checked = false; pay(x); }} />
      <span>${bank ? 'Betala' : 'Swisha'} <strong>${x.group?.name || x.author.name}</strong>${x.group ? html` <span class="muted">(via ${x.author.name})</span>` : ''} ${fmtKr(x.applied_amount)} till ${bank ? 'bankkonto ' : ''}<strong>${to}</strong>
        <small><a href=${'#/post/' + x.post.id}>${x.post.group ? x.post.group.name + ': ' : ''}${x.post.caption.slice(0, 60)}${x.post.caption.length > 60 ? '…' : ''}</a></small></span>
    </label>`;
  };
  return html`<div class="page">
    <${Header} title="Att göra" back />
    ${t.loading && !t.data ? html`<${Loading} />` : t.error ? html`<${ErrorBox} error=${t.error} />` : html`
      <p class="hint pad">När du beviljar en ansökan hamnar utbetalningen här. Bocka av när pengarna är skickade – då minskar det som finns kvar på inlägget.</p>
      ${open.length ? html`<div class="list">${open.map(item)}</div>` : html`<p class="empty">Inget att göra just nu.</p>`}
      ${done.length > 0 && html`<div class="label pad-x">Klart</div><div class="list">${done.map(item)}</div>`}`}
  </div>`;
}

const dayLabel = (iso) => {
  const d = new Date(iso), today = new Date();
  const y = new Date(); y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Idag';
  if (d.toDateString() === y.toDateString()) return 'Igår';
  return d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
};
const clock = (iso) => new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

export function Inbox() {
  const s = useStore();
  const c = useAsync(() => api.listConversations(), []);
  return html`<div class="page">
    <${Header} title="Meddelanden" back right=${html`<a class="iconbtn" href="#/meddelanden/ny" aria-label="Nytt meddelande"><${Icon} name="edit" /></a>`} />
    ${c.loading && !c.data ? html`<${Loading} />` : c.error ? html`<${ErrorBox} error=${c.error} />`
      : c.data.length === 0 ? html`<div class="empty">
          <p>Inga meddelanden än.</p><a class="btn primary" href="#/meddelanden/ny">Skriv ett meddelande</a></div>`
      : html`<div class="list">${c.data.map((x) => html`<a key=${x.user.id} class=${'row convo' + (x.unread ? ' unread' : '')} href=${'#/meddelanden/' + x.user.id}>
          <${Avatar} src=${x.user.avatar_url} name=${x.user.name} size=${52} />
          <span class="row-main"><strong>${x.user.name}</strong>
            <small class="snippet">${x.last.from_id === s.me.id ? 'Du: ' : ''}${x.last.body.replace(/\s+/g, ' ')}</small></span>
          <span class="convo-side"><small class="muted">${timeAgo(x.last.created_at)}</small>${x.unread > 0 && html`<span class="unread-dot" aria-label=${`${x.unread} olästa`}></span>`}</span>
        </a>`)}</div>`}
  </div>`;
}

export function Thread({ userId }) {
  const s = useStore();
  const u = useAsync(() => api.getUser(userId), [userId]);
  const t = useAsync(() => api.getThread(userId), [userId]);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef();
  useEffect(() => { if (t.data) { refreshBadges(); end.current?.scrollIntoView({ block: 'end' }); } }, [t.data]);
  useEffect(() => { const i = setInterval(t.reload, 15000); return () => clearInterval(i); }, [userId]); // hämtar nya meddelanden då och då
  async function send(e) {
    e?.preventDefault();
    if (!body.trim() || busy) return;
    setBusy(true);
    if (await attempt(() => api.sendMessage(userId, body))) { setBody(''); t.reload(); }
    setBusy(false);
  }
  const user = u.data;
  const msgs = t.data || [];
  return html`<div class="page chat">
    <header class="topbar">
      <div class="topbar-side"><button class="iconbtn" aria-label="Tillbaka" onClick=${() => (history.length > 1 ? history.back() : go('/meddelanden'))}><${Icon} name="back" /></button></div>
      <a class="chat-title" href=${'#/profil/' + userId}>${user && html`<${Avatar} src=${user.avatar_url} name=${user.name} size=${30} />`}<strong>${user?.name || ''}</strong></a>
      <div class="topbar-side right"></div>
    </header>
    <div class="bubbles">
      ${t.loading && !t.data ? html`<${Loading} />` : msgs.length === 0 && user ? html`<div class="chat-start">
          <${Avatar} src=${user.avatar_url} name=${user.name} size=${72} /><strong>${user.name}</strong>
          <small class="muted">Skriv det första meddelandet.</small></div>` : null}
      ${msgs.map((m, i) => {
        const mine = m.from_id === s.me.id;
        const prev = msgs[i - 1], next = msgs[i + 1];
        const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
        const lastInRun = !next || next.from_id !== m.from_id || new Date(next.created_at) - new Date(m.created_at) > 5 * 60e3;
        return html`<${'div'} key=${m.id}>
          ${newDay && html`<div class="day">${dayLabel(m.created_at)}</div>`}
          <div class=${'bubble-row' + (mine ? ' mine' : '')}>
            <div class=${'bubble' + (lastInRun ? ' tail' : '')}>${linkify(m.body)}</div>
          </div>
          ${lastInRun && html`<div class=${'stamp' + (mine ? ' mine' : '')}>${clock(m.created_at)}</div>`}
        <//>`;
      })}
      <div ref=${end}></div>
    </div>
    <form class="composer" onSubmit=${send}>
      <textarea rows="1" value=${body} placeholder="Meddelande…" aria-label="Meddelande"
        onInput=${(e) => { setBody(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; }}
        onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}></textarea>
      <button class="send" disabled=${!body.trim() || busy}>Skicka</button>
    </form>
  </div>`;
}

export function NewMessage() {
  const s = useStore();
  const [q, setQ] = useState('');
  const users = useAsync(() => api.listUsers(q), [q]);
  return html`<div class="page">
    <${Header} title="Nytt meddelande" back />
    <div class="searchbar"><input type="search" value=${q} onInput=${(e) => setQ(e.target.value)} placeholder="Sök efter en person" aria-label="Sök efter en person" autofocus /></div>
    <div class="list">${(users.data || []).filter((u) => u.id !== s.me.id).map((u) => html`<${UserRow} key=${u.id} user=${u} href=${'#/meddelanden/' + u.id} />`)}</div>
  </div>`;
}
