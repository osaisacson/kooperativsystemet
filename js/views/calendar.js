// Kalendern: kommande evenemang, filtrerade på vald stad/region/land och på postnummer.
import { html, useState } from '../lib.js';
import { api } from '../api/index.js';
import { useStore, useAsync } from '../store.js';
import { Avatar, Loading, ErrorBox } from '../ui.js';
import { inPlace, placeLabel, eventTitle } from '../util.js';
import { PlaceSwitcher } from './feed.js';

// Var evenemanget äger rum – evenemangets egen plats, annars gruppens.
const eventPlace = (p) => ({
  city: p.event_city || p.group?.city, region: p.event_region || p.group?.region, country: p.event_country || p.group?.country,
});

export function CalendarView() {
  const s = useStore();
  const [zip, setZip] = useState('');
  const events = useAsync(() => api.listEvents(), []);
  const groups = useAsync(() => api.listGroups(), []);
  const place = s.place || { level: 'world' };
  const digits = zip.replace(/\D/g, '');
  const list = (events.data || []).filter((p) => inPlace(eventPlace(p), place)
    && (!digits || (p.event_postcode || '').replace(/\D/g, '').startsWith(digits)));

  // Gruppera per dag
  const days = [];
  for (const p of list) {
    const d = new Date(p.event_start);
    const key = d.toDateString();
    if (!days.length || days[days.length - 1].key !== key) days.push({ key, date: d, items: [] });
    days[days.length - 1].items.push(p);
  }
  const dayLabel = (d) => {
    const t = new Date(); const tm = new Date(); tm.setDate(t.getDate() + 1);
    if (d.toDateString() === t.toDateString()) return 'Idag';
    if (d.toDateString() === tm.toDateString()) return 'Imorgon';
    const s = d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const time = (iso) => new Date(iso).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });

  return html`<div class="page">
    <header class="topbar brand"><${PlaceSwitcher} groups=${groups.data || []} />
      <a class="chip-add" href="#/ny?typ=evenemang" aria-label="Nytt evenemang" style="margin-left:auto"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></a></header>
    <div class="cal-filter">
      <input inputmode="numeric" value=${zip} onInput=${(e) => setZip(e.target.value)} placeholder="Postnummer" aria-label="Filtrera på postnummer" />
      ${zip && html`<button class="clear" aria-label="Rensa" onClick=${() => setZip('')}>×</button>`}
    </div>
    ${events.loading && !events.data ? html`<${Loading} />` : events.error ? html`<${ErrorBox} error=${events.error} />`
      : !days.length ? html`<p class="empty">Inga kommande evenemang i ${placeLabel(place)}${digits ? ` med postnummer ${zip}` : ''}.
          <br /><span class="small">Tryck på <b>+</b> uppe till höger för att lägga upp ett.</span></p>`
      : days.map((d) => html`<section class="cal-day" key=${d.key}>
          <h2 class="cal-date">${dayLabel(d.date)}</h2>
          ${d.items.map((p) => html`<a class="cal-item" href=${'#/post/' + p.id} key=${p.id}>
            <span class="cal-time">${time(p.event_start)}${p.event_end ? html`<small>${time(p.event_end)}</small>` : ''}</span>
            <span class="cal-main">
              <strong>${eventTitle(p)}</strong>
              <small class="muted">${[p.event_address || p.event_city, p.group?.name].filter(Boolean).join(' · ')}</small>
              ${p.event_rsvp && (p.rsvp_going || p.rsvp_interested) ? html`<small class="cal-count">${p.rsvp_going} kommer · ${p.rsvp_interested} intresserade</small>` : ''}
            </span>
            ${p.group && html`<${Avatar} src=${p.group.avatar_url} name=${p.group.name} size=${36} />`}
          </a>`)}
        </section>`)}
  </div>`;
}
