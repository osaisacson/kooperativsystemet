// Liten global state: inloggad användare, mina grupper och siffror på ikonerna.
import { useState, useEffect } from './lib.js';
import { api } from './api/index.js';

const listeners = new Set();
export const state = {
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
  try { setState({ badges: await api.badges() }); } catch (e) { console.warn(e); }
}

export async function refreshMe() {
  const me = await api.getMe();
  setState({ recovering: !!api.isRecovering?.() });
  if (!me) return setState({ me: null, myGroups: [], memberOf: new Set(), adminOf: new Set() });
  const myGroups = await api.myGroups();
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
