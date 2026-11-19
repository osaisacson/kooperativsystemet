// Liten global state: inloggad användare, mina grupper och siffror på ikonerna.
import { useState, useEffect } from './lib.js';
import { api } from './api/index.js';

const listeners = new Set();
// Vald plats för flödet (stad, region, land eller hela världen). Sparas i webbläsaren.
function loadPlace() { try { return JSON.parse(localStorage.getItem('place')) || null; } catch { return null; } }
export function setPlace(place) {
  try { localStorage.setItem('place', JSON.stringify(place)); } catch { /* går bra utan */ }
  setState({ place });
}
// Standard: staden där de flesta av ens grupper finns.
function defaultPlace(groups) {
  const counts = {};
  for (const g of groups) if (g.city) { const k = `${g.city}|${g.region || ''}|${g.country || ''}`; counts[k] = (counts[k] || 0) + 1; }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (!best) return { level: 'world' };
  const [city, region, country] = best[0].split('|');
  return { level: 'city', city, region: region || null, country: country || null };
}

export const state = {
  place: loadPlace(),
  me: null, myGroups: [], memberOf: new Set(), adminOf: new Set(),
  badges: { notifications: 0, messages: 0, todos: 0 }, toast: null,
};

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((l) => l());
}
export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => listeners.delete(l);
  }, []);
  return state;
}

export const go = (path) => { location.hash = '#' + path; };

let toastTimer;
export function toast(msg) {
  setState({ toast: msg });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setState({ toast: null }), 3200);
}

export async function refreshBadges() {
  if (!state.me) return;
  try {
    const badges = await api.badges();
    setState({ badges });
    // Röd prick/siffra på appikonen: olästa meddelanden + saker att göra med finansiering.
    const n = (badges.messages || 0) + (badges.todos || 0);
    if ('setAppBadge' in navigator) (n ? navigator.setAppBadge(n) : navigator.clearAppBadge()).catch(() => {});
  } catch (e) { console.warn(e); }
}

export async function refreshMe() {
  const me = await api.getMe();
  setState({ recovering: !!api.isRecovering?.() });
  if (!me) return setState({ me: null, myGroups: [], memberOf: new Set(), adminOf: new Set() });
  const myGroups = await api.myGroups();
  const isNew = Date.now() - new Date(me.created_at) < 10 * 60e3;
  if (isNew && !myGroups.length && (location.hash === '' || location.hash === '#/')) go('/valkommen');
  if (!state.place) setState({ place: defaultPlace(myGroups) });
  setState({
    me, myGroups,
    memberOf: new Set(myGroups.map((g) => g.id)),
    adminOf: new Set(myGroups.filter((g) => g.role === 'admin').map((g) => g.id)),
  });
  api.touch().catch(() => {});
  refreshBadges();
}

// Hämtar data asynkront och laddar om när beroenden ändras.
export function useAsync(fn, deps = []) {
  const [s, set] = useState({ loading: true, data: null, error: null });
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    set((x) => ({ ...x, loading: true }));
    fn().then(
      (data) => alive && set({ loading: false, data, error: null }),
      (error) => { console.error(error); alive && set({ loading: false, data: null, error }); },
    );
    return () => { alive = false; };
  }, [...deps, n]);
  return { ...s, reload: () => setN((x) => x + 1) };
}

// Kör en åtgärd och visar felet som toast i stället för att krascha.
export async function attempt(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r ?? true; }
  catch (e) { toast(e.message || String(e)); return false; }
}
