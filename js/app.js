// Startpunkt: enkel hash-router (#/sökväg) + bottenmenyn.
import { html, render, useState, useEffect, Component } from './lib.js';
import { api } from './api/index.js';
import { useStore, refreshMe, refreshBadges, toast } from './store.js';
import { Icon, Avatar, Count } from './ui.js';
import { Home, PostView, Compose } from './views/feed.js';
import { GroupView, GroupSettings, NewGroup, Welcome } from './views/groups.js';
import { AuthView, Search, Profile, EditProfile, NewPassword } from './views/people.js';
import { Notifications, Todos, Inbox, Thread, NewMessage } from './views/inbox.js';
import { MapView } from './views/map.js';
import { CalendarView } from './views/calendar.js';

function parse() {
  let h = location.hash.slice(1);
  // Länkar från inloggningsmejl (#access_token=…, #error=…) är inga sidor i appen.
  if (/(^|&)(access_token|error|error_description)=/.test(h)) h = '/';
  const [path, qs] = (h || '/').split('?');
  return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') };
}

function route({ parts: [a, b, c], query }) {
  switch (a) {
    case undefined: return html`<${Home} />`;
    case 'sok': return html`<${Search} tab=${query.get('flik')} />`;
    case 'ny': return html`<${Compose} groupId=${query.get('grupp')} type=${query.get('typ')} />`;
    case 'notiser': return html`<${Notifications} />`;
    case 'karta': return html`<${MapView} />`;
    case 'kalender': return html`<${CalendarView} />`;
    case 'profil': return html`<${Profile} id=${b} />`;
    case 'redigera-profil': return html`<${EditProfile} />`;
    case 'grupp': return c === 'installningar' ? html`<${GroupSettings} id=${b} />` : html`<${GroupView} id=${b} />`;
    case 'ny-grupp': return html`<${NewGroup} next=${query.get('next')} />`;
    case 'valkommen': return html`<${Welcome} />`;
    case 'post': return c === 'redigera' ? html`<${Compose} editId=${b} />` : html`<${PostView} id=${b} />`;
    case 'meddelanden': return b === 'ny' ? html`<${NewMessage} />` : b ? html`<${Thread} userId=${b} />` : html`<${Inbox} />`;
    case 'att-gora': return html`<${Todos} />`;
    default: return html`<p class="empty">Sidan finns inte. <a href="#/">Till flödet</a></p>`;
  }
}

function BottomNav({ r }) {
  const s = useStore();
  const [a, b] = r.parts;
  const item = (href, label, on, icon, n) => html`<a href=${href} aria-label=${label} class=${on ? 'on' : ''}>${icon}<${Count} n=${n} /></a>`;
  return html`<nav class="bottomnav">
    ${item('#/', 'Hem', !a, html`<${Icon} name="home" size=${26} />`)}
    ${item('#/kalender', 'Kalender', a === 'kalender', html`<${Icon} name="calendar" size=${26} />`)}
    ${item('#/sok', 'Sök', a === 'sok', html`<${Icon} name="search" size=${26} />`)}
    ${item('#/ny', 'Nytt inlägg', a === 'ny', html`<${Icon} name="plus" size=${26} />`)}
    ${item('#/profil/' + s.me.id, 'Min profil', a === 'profil' && b === s.me.id, html`<span class="nav-avatar"><${Avatar} src=${s.me.avatar_url} name=${s.me.name} size=${26} /></span>`)}
  </nav>`;
}

// Fångar fel på en sida så att appen inte blir en vit, fryst skärm.
class Safe extends Component {
  constructor() { super(); this.state = { error: null }; }
  componentDidCatch(error) { console.error(error); this.setState({ error }); }
  render() {
    if (!this.state.error) return this.props.children;
    return html`<div class="crash">
      <h2>Något gick fel på den här sidan</h2>
      <p class="muted">${String(this.state.error?.message || this.state.error).slice(0, 160)}</p>
      <div class="btnrow"><a class="btn primary" href="#/" onClick=${() => this.setState({ error: null })}>Till flödet</a>
        <button class="btn" onClick=${() => location.reload()}>Ladda om</button></div>
    </div>`;
  }
}

function App() {
  const s = useStore();
  const [r, setR] = useState(parse());
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const onHash = () => {
      setR(parse()); window.scrollTo(0, 0); refreshBadges();
      document.body.classList.remove('locked');   // en meny som var öppen när man bytte sida ska inte låsa skärmen
    };
    const linkError = api.takeLinkError?.() || new URLSearchParams(location.hash.slice(1)).get('error_description');
    if (linkError) {
      toast(/expired|invalid/i.test(linkError) ? 'Länken har gått ut eller redan använts. Be om en ny.' : linkError);
      history.replaceState(null, '', location.pathname);
    }
    addEventListener('hashchange', onHash);
    refreshMe().catch(console.error).finally(() => setReady(true));
    const off = api.onAuthChange(() => refreshMe());
    const t = setInterval(refreshBadges, 30000);
    return () => { removeEventListener('hashchange', onHash); off(); clearInterval(t); };
  }, []);
  if (!ready) return html`<div class="splash">…</div>`;
  return html`<div class="app">
    ${s.recovering ? html`<${NewPassword} />` : s.me ? html`<main key=${r.path + '?' + r.query}><${Safe}>${route(r)}<//></main><${BottomNav} r=${r} />` : html`<${AuthView} />`}
    ${s.toast && html`<div class="toast" role="status">${s.toast}</div>`}
  </div>`;
}

render(html`<${App} />`, document.getElementById('root'));

// Service worker för push-notiser (och siffran på appikonen när appen är stängd)
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
