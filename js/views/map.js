// Karta över grupperna. Zoomar automatiskt till vald stad, region, land eller hela världen.
// Kartan kommer från OpenStreetMap via biblioteket Leaflet (laddas först när kartan öppnas).
import { html, useEffect, useRef } from '../lib.js';
import { api } from '../api/index.js';
import { useStore, useAsync, go } from '../store.js';
import { Icon, Avatar, Loading } from '../ui.js';
import { inPlace, placeLabel } from '../util.js';
import { PlaceSwitcher } from './feed.js';

let leaflet;
function loadLeaflet() {
  if (leaflet) return leaflet;
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);
  leaflet = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => res(window.L);
    s.onerror = () => rej(new Error('Kunde inte ladda kartan.'));
    document.head.appendChild(s);
  });
  return leaflet;
}

const ZOOM = { city: 12, region: 8, country: 5, world: 2 };
const where = (g) => (g.address ? (g.city && !g.address.toLowerCase().includes(g.city.toLowerCase()) ? `${g.address}, ${g.city}` : g.address) : g.city || '');
const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function MapView() {
  const s = useStore();
  const groups = useAsync(() => api.listGroups(), []);
  const box = useRef();
  const map = useRef();
  const layer = useRef();
  const place = s.place || { level: 'world' };
  const all = groups.data || [];
  const here = all.filter((g) => inPlace(g, place));
  const placed = here.filter((g) => g.lat != null && g.lng != null);

  useEffect(() => {
    if (!groups.data) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !box.current) return;
      if (!map.current) {
        map.current = L.map(box.current, { zoomControl: true, attributionControl: true });
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map.current);
        layer.current = L.layerGroup().addTo(map.current);
      }
      layer.current.clearLayers();
      for (const g of placed) {
        const icon = L.divIcon({
          className: 'map-pin',
          html: g.avatar_url ? `<img src="${esc(g.avatar_url)}" alt="" />` : `<span>${esc(g.name.slice(0, 1))}</span>`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        });
        L.marker([g.lat, g.lng], { icon, title: g.name }).addTo(layer.current)
          .bindPopup(`<a class="map-pop" href="#/grupp/${g.id}"><strong>${esc(g.name)}</strong><br><small>${esc(where(g))}</small></a>`);
      }
      // Zooma till vald plats
      if (placed.length > 1) map.current.fitBounds(L.latLngBounds(placed.map((g) => [g.lat, g.lng])), { padding: [40, 40], maxZoom: ZOOM[place.level] + 2 });
      else if (placed.length === 1) map.current.setView([placed[0].lat, placed[0].lng], ZOOM[place.level] + (place.level === 'city' ? 1 : 0));
      else map.current.setView([20, 10], 2);
      setTimeout(() => map.current?.invalidateSize(), 50);
    }, () => {});
    return () => { cancelled = true; };
  }, [groups.data, place.level, placeLabel(place)]);

  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  const missing = here.length - placed.length;
  return html`<div class="page map-page">
    <header class="topbar brand">
      <button class="iconbtn" aria-label="Tillbaka" onClick=${() => (history.length > 1 ? history.back() : go('/'))}><${Icon} name="back" /></button>
      <${PlaceSwitcher} groups=${all} />
    </header>
    <div class="map-box" ref=${box}>${groups.loading && !groups.data && html`<${Loading} />`}</div>
    <div class="map-list">
      <div class="label pad-x">${here.length} ${here.length === 1 ? 'grupp' : 'grupper'} i ${placeLabel(place)}${missing > 0 ? html` <span class="muted small">(${missing} saknar plats på kartan)</span>` : ''}</div>
      <div class="list">${here.map((g) => html`<a class="row" href=${'#/grupp/' + g.id} key=${g.id}>
        <${Avatar} src=${g.avatar_url} name=${g.name} size=${40} />
        <span class="row-main"><strong>${g.name}</strong><small class="muted">${where(g)}</small></span></a>`)}</div>
    </div>
  </div>`;
}
