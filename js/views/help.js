// Frågetecknet: feedback, om plattformen, Redaktionen, finansiering och det juridiska.
import { html, useState } from '../lib.js';
import { api } from '../api/index.js';
import { useStore, useAsync, go, attempt, toast } from '../store.js';
import { Icon, Avatar, Header, Loading, ErrorBox, linkify, ReportForm } from '../ui.js';
import { timeAgo } from '../util.js';
import { CONTACT_EMAIL } from '../config.js';

const OPEN_COLLECTIVE = 'https://opencollective.com/post-growth-sverige';

export function About() {
  return html`<div class="about">
    <blockquote><p>Growth has costs as well as benefits, but we usually don’t count the costs.</p><cite>Meadows (1999)</cite></blockquote>
    <p>… men just nu märker vi kostnaderna.</p>
    <blockquote><p>Earth is now well outside of the safe operating space for humanity.</p><cite>Richardson et al. (2023)</cite></blockquote>
    <p>Vi behöver ställa om hur vi gör saker – hitta sätt att leva inom planetens gränser och samtidigt ge alla en god levnadsstandard.
      Men att ställa om ett helt samhälle är ett enormt åtagande. I praktiken betyder det att nästan allt behöver bli annorlunda än i dag:</p>
    <blockquote><p>…everything will need to be different: different activities, different forms and uses of energy, different relations, different gender roles,
      different allocations of time between paid and non-paid work, different relations with the non-human world.</p><cite>Kallis et al. (2014, s. 33)</cite></blockquote>
    <p>En sådan omställning är inte lätt att föreställa sig, och samma lösning passar inte alla. Vi behöver därför göra den hanterbar:
      ta den i en skala som går att greppa, och pröva oss fram på sätt som passar platsen och människorna där.</p>
    <p>Sverige har fler sådana platser än man kanske tror – från ekobyar till byggemenskaper, från makerspaces till stödstrukturer,
      från konstnärskollektiv till odlingsgrupper. Alla undersöker, på ett eller annat sätt, hur man i praktiken kan göra
      <em>småskaliga omkonfigurationer av samhället</em>: hur vi kan bygga, bo, äta, producera, hantera energi och avfall, skapa rättvisa och relationer – annorlunda.</p>
    <p>Den här plattformen finns för att vi ska bli synliga för varandra och kunna dela det vi gör.</p>
    <p>För vi är fler än man tror, och tillsammans är vi starka. Hur äter man en elefant? <em>Bit för bit.</em></p>
  </div>`;
}

// Villkoren – visas på hjälpsidan och kan fällas ut när man skapar konto.
export const Terms = () => html`<div class="prose">
  <p>Omställningsplatser är en ideell, öppen plattform som drivs av gruppen Omställningsplatser. Den är gratis och har ingen reklam.</p>
  <ul>
    <li><b>Du måste vara minst 13 år</b> för att skapa ett konto.</li>
    <li><b>Du ansvarar för det du lägger upp.</b> Lägg bara upp sådant du har rätt att dela, och fråga innan du lägger upp bilder där andra syns.</li>
    <li><b>Inget olagligt, hatiskt, hotfullt eller trakasserande</b>, ingen spam och inga andras personuppgifter utan lov.</li>
    <li><b>Finansiering och lokaler</b> avtalas direkt mellan grupperna. Plattformen hanterar inga pengar och ansvarar inte för överenskommelser mellan användare.</li>
    <li><b>Redaktionen</b> kan ta bort inlägg, grupper och konton som bryter mot villkoren.</li>
    <li>Du kan när som helst radera ditt konto. Då försvinner din profil, dina inlägg, kommentarer och meddelanden.</li>
    <li>Ändras villkoren meddelar vi det i appen.</li>
  </ul>
</div>`;

function Section({ title, open = false, children }) {
  return html`<details class="help-sec" open=${open}><summary>${title}</summary><div class="help-body">${children}</div></details>`;
}

function Editors() {
  const s = useStore();
  const e = useAsync(() => api.listEditors(), []);
  return html`<p>Redaktionen representerar gruppen ${e.data?.groupId ? html`<a href=${'#/grupp/' + e.data.groupId}>Omställningsplatser</a>` : 'Omställningsplatser'}, som ansvarar för plattformen. Redaktionen</p>
    <ul>
      <li>går igenom anmälningar av inlägg, grupper och användare,</li>
      <li>kan ta bort inlägg, grupper och konton som bryter mot villkoren,</li>
      <li>markerar feedback som planerad, klar eller inte nu,</li>
      <li>kan lägga till och ta bort personer i Redaktionen.</li>
    </ul>
    <p>Allt Redaktionen gör sparas i en gemensam historik som alla i Redaktionen ser och kan ångra.</p>
    ${e.loading && !e.data ? html`<${Loading} />` : html`<div class="list editors">${(e.data?.editors || []).map((u) => html`<a class="row" href=${'#/profil/' + u.id} key=${u.id}>
      <${Avatar} src=${u.avatar_url} name=${u.name} size=${36} /><span class="row-main"><strong>${u.name}${u.id === s.me.id ? ' (du)' : ''}</strong></span></a>`)}</div>`}
    ${s.me.is_editor && html`<p class="small muted">Lägg till någon: gå till personens profil och tryck <b>Lägg till i Redaktionen</b>.</p>`}`;
}

function DeleteAccount() {
  async function del() {
    if (!confirm('Radera ditt konto? Din profil, dina inlägg, kommentarer och meddelanden tas bort för gott. Det går inte att ångra.')) return;
    if (prompt('Skriv RADERA för att bekräfta.')?.trim().toUpperCase() !== 'RADERA') return toast('Kontot raderades inte.');
    if (await attempt(() => api.deleteMyAccount(), 'Ditt konto är raderat')) { location.hash = '#/'; location.reload(); }
  }
  return html`<p>Raderar du kontot tas din profil, plats, dina inlägg, kommentarer, meddelanden och röster bort direkt. Grupper du har skapat finns kvar för de andra medlemmarna.</p>
    <button class="btn danger" onClick=${del}>Radera mitt konto</button>`;
}

export function Help() {
  return html`<div class="page help">
    <${Header} title="Hjälp och info" />
    <a class="feedback-banner" href="#/feedback">
      <span class="fb-icon"><${Icon} name="chat" size=${26} /></span>
      <span><strong>Tyck till om appen</strong><small>Förslag, problem och idéer – rösta på det du också vill ha.</small></span>
      <span class="fb-go">›</span>
    </a>
    <${Section} title="Om Omställningsplatser" open><${About} /><//>
    <${Section} title="Redaktionen"><${Editors} /><//>
    <${Section} title="Finansiering av plattformen">
      <p>Plattformen föreslås drivas med frivilliga medlemskap och donationer via Open Collective, där alla inkomster och utgifter syns öppet.</p>
      <p><b>Vill du stötta oss?</b> <a href=${OPEN_COLLECTIVE} target="_blank" rel="noopener noreferrer">Till vår sida på Open Collective ›</a></p>
      <p class="small muted">Länken går just nu till Post Growth Sverige – den är bara ett exempel på hur det kan se ut.</p>
    <//>
    <${Section} title="Användarvillkor"><${Terms} /><//>
    <${Section} title="Integritet">
      <p>Vi samlar bara in det som behövs för att appen ska fungera: namn, e-post, profilbild och det du själv lägger upp. Din plats syns bara för dig.
        Vi säljer inga uppgifter, har ingen reklam och spårar dig inte.</p>
      <p><a href="integritet.html">Läs hela integritetspolicyn ›</a></p>
    <//>
    <${Section} title="Anmäla innehåll">
      <p>Ser du något som bryter mot villkoren? Tryck på <b>···</b> på inlägget och välj <b>Anmäl till Redaktionen</b>. Grupper och personer anmäler du längst ner på deras sidor.</p>
      <p>Anmälan går till Redaktionen. Den du anmäler får inte veta vem som anmälde. Är någon i fara eller är det ett brott – kontakta polisen.</p>
    <//>
    <${Section} title="Radera ditt konto"><${DeleteAccount} /><//>
    <${Section} title="Kontakt">
      <p>Frågor? Mejla <a href=${'mailto:' + CONTACT_EMAIL}>${CONTACT_EMAIL}</a>.</p>
      <p class="small muted">Omställningsplatser är öppen källkod: <a href="https://github.com/osaisacson/kooperativsystemet" target="_blank" rel="noopener noreferrer">github.com/osaisacson/kooperativsystemet</a></p>
    <//>
  </div>`;
}

// ---------- Feedback: en enkel forumtråd med röster ----------

const STATUS = { planerad: 'Planerad', klar: 'Klar', 'inte nu': 'Inte nu' };
const StatusChip = ({ status }) => status ? html`<span class=${'fb-status ' + status.replace(' ', '-')}>${STATUS[status]}</span>` : null;

function Votes({ f, onChange }) {
  const [mine, setMine] = useState(f.my_vote);
  const score = f.score - f.my_vote + mine;
  async function vote(v) {
    const next = mine === v ? 0 : v;
    setMine(next);
    try { await api.voteFeedback(f.id, next); onChange?.(); } catch (e) { setMine(mine); toast(e.message); }
  }
  return html`<div class="votes" onClick=${(e) => { e.preventDefault(); e.stopPropagation(); }}>
    <button class=${'vote up' + (mine > 0 ? ' on' : '')} aria-label="Rösta upp" aria-pressed=${mine > 0} onClick=${() => vote(1)}><${Icon} name="up" size=${20} /></button>
    <span class="score" aria-label=${score + ' poäng'}>${score}</span>
    <button class=${'vote down' + (mine < 0 ? ' on' : '')} aria-label="Rösta ner" aria-pressed=${mine < 0} onClick=${() => vote(-1)}><${Icon} name="down" size=${20} /></button>
  </div>`;
}

function NewFeedback({ onDone }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true);
    const id = await attempt(() => api.createFeedback({ title, body }), 'Tack! Nu kan andra rösta på det.');
    setBusy(false);
    if (id) { setTitle(''); setBody(''); setOpen(false); onDone(); }
  }
  if (!open) return html`<button class="btn primary block fb-new" onClick=${() => setOpen(true)}><${Icon} name="add" size=${18} /> Skriv ett förslag eller problem</button>`;
  return html`<form class="form fb-form" onSubmit=${submit}>
    <label>Rubrik<input required maxlength="140" value=${title} onInput=${(e) => setTitle(e.target.value)} placeholder="T.ex. Visa evenemang på kartan" /></label>
    <label>Beskriv gärna mer <small class="muted">(valfritt)</small><textarea rows="4" maxlength="4000" value=${body} onInput=${(e) => setBody(e.target.value)}
      placeholder="Vad vill du kunna göra? Vad hände, och vad hade du väntat dig?"></textarea></label>
    <div class="btnrow"><button class="btn primary" disabled=${busy}>${busy ? 'Skickar…' : 'Publicera'}</button>
      <button type="button" class="btn" onClick=${() => setOpen(false)}>Avbryt</button></div>
  </form>`;
}

export function Feedback() {
  const [sort, setSort] = useState('top');
  const list = useAsync(() => api.listFeedback(), []);
  const items = [...(list.data || [])].sort(sort === 'top'
    ? (a, b) => b.score - a.score || b.created_at.localeCompare(a.created_at)
    : (a, b) => b.created_at.localeCompare(a.created_at));
  return html`<div class="page feedback">
    <${Header} title="Feedback" back />
    <div class="intro">
      <p><b>Hjälp oss göra appen bättre.</b> Skriv ett förslag eller beskriv ett problem – en sak per inlägg, så går det att rösta på.
        Finns det redan? Rösta upp det i stället (▲), eller ner (▼) om du tycker att det är en dålig idé. Kommentera för att utveckla.</p>
      <p class="small muted">Redaktionen läser allt och markerar vad som är <b>planerat</b>, <b>klart</b> eller <b>inte blir av just nu</b>.</p>
    </div>
    <div class="pad-x"><${NewFeedback} onDone=${list.reload} /></div>
    <div class="chips pad-x fb-sort">
      <button class=${'chip' + (sort === 'top' ? ' on' : '')} onClick=${() => setSort('top')}>Populärast</button>
      <button class=${'chip' + (sort === 'new' ? ' on' : '')} onClick=${() => setSort('new')}>Nyast</button>
    </div>
    ${list.loading && !list.data ? html`<${Loading} />` : list.error ? html`<${ErrorBox} error=${list.error} />`
      : !items.length ? html`<p class="empty">Inget här än – bli först!</p>`
      : html`<div class="fb-list">${items.map((f) => html`<a class="fb-item" href=${'#/feedback/' + f.id} key=${f.id}>
          <${Votes} f=${f} />
          <span class="fb-main"><strong>${f.title}</strong>
            <small class="muted"><${StatusChip} status=${f.status} /> ${f.author?.name || 'Borttagen'} · ${timeAgo(f.created_at)} · ${f.comment_count} ${f.comment_count === 1 ? 'kommentar' : 'kommentarer'}</small></span>
        </a>`)}</div>`}
  </div>`;
}

export function FeedbackView({ id }) {
  const s = useStore();
  const f = useAsync(() => api.getFeedback(id), [id]);
  const [body, setBody] = useState('');
  const [reporting, setReporting] = useState(false);
  const x = f.data;
  const mine = x?.author_id === s.me.id;
  async function send(e) {
    e.preventDefault();
    if (await attempt(() => api.commentFeedback(id, body))) { setBody(''); f.reload(); }
  }
  async function del() {
    if (!confirm(mine ? 'Ta bort ditt inlägg?' : 'Ta bort inlägget som Redaktionen? Det syns i historiken.')) return;
    if (await attempt(() => api.deleteFeedback(id), 'Borttaget')) go('/feedback');
  }
  return html`<div class="page feedback">
    <${Header} title="Feedback" back />
    ${f.loading && !x ? html`<${Loading} />` : f.error ? html`<${ErrorBox} error=${f.error} />` : html`
      <article class="fb-detail">
        <${Votes} f=${x} />
        <div class="fb-main">
          <h2>${x.title} <${StatusChip} status=${x.status} /></h2>
          <small class="muted"><a href=${'#/profil/' + x.author?.id}>${x.author?.name}</a> · ${timeAgo(x.created_at)}</small>
          ${x.body && html`<p class="fb-body">${linkify(x.body)}</p>`}
          <div class="fb-actions">
            ${s.me.is_editor && html`<label class="fb-set">Status
              <select value=${x.status || ''} onChange=${async (e) => { if (await attempt(() => api.setFeedbackStatus(id, e.target.value), 'Status ändrad')) f.reload(); }}>
                <option value="">Ingen</option>${Object.entries(STATUS).map(([k, v]) => html`<option value=${k}>${v}</option>`)}
              </select></label>`}
            ${(mine || s.me.is_editor) && html`<button class="link danger" onClick=${del}>Ta bort</button>`}
            ${!mine && html`<button class="link muted" onClick=${() => setReporting(true)}>Anmäl</button>`}
          </div>
        </div>
      </article>
      <h3 class="label pad-x">${x.comments.length} ${x.comments.length === 1 ? 'kommentar' : 'kommentarer'}</h3>
      <div class="fb-comments">${x.comments.map((c) => html`<div class="fb-comment" key=${c.id}>
        <${Avatar} src=${c.author.avatar_url} name=${c.author.name} size=${28} />
        <div><a href=${'#/profil/' + c.author.id}><strong>${c.author.name}</strong></a> <small class="muted">${timeAgo(c.created_at)}</small>
          <p>${linkify(c.body)}</p>
          ${(c.author.id === s.me.id || s.me.is_editor) && html`<button class="link small muted" onClick=${async () => { if (confirm('Ta bort kommentaren?') && await attempt(() => api.deleteFeedbackComment(c.id))) f.reload(); }}>Ta bort</button>`}
        </div></div>`)}</div>
      <form class="comment-form" onSubmit=${send}>
        <input value=${body} onInput=${(e) => setBody(e.target.value)} placeholder="Skriv en kommentar…" aria-label="Kommentar" />
        <button class="link strong" disabled=${!body.trim()}>Publicera</button>
      </form>
      ${reporting && html`<${ReportForm} kind="feedback" id=${id} name=${x.title.slice(0, 60)} onClose=${() => setReporting(false)} />`}`}
  </div>`;
}
