// Spara appen på hemskärmen. Android och datorer med Chrome/Edge kan installera med en knapp (beforeinstallprompt);
// på iPhone finns ingen sådan knapp, så där visas stegen i Safari. Webbläsaren låter inte appen installera sig själv
// utan att man trycker, så det bästa vi kan göra är en tydlig fråga direkt när appen öppnas i webbläsaren.
import { html, useState, useEffect } from './lib.js';
import { Icon } from './ui.js';

let deferred = null;
const subs = new Set();
const emit = () => subs.forEach((f) => f());
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit(); });
addEventListener('appinstalled', () => { deferred = null; try { localStorage.setItem('install-hint-closed', '1'); } catch { /* ok */ } emit(); });

export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const useInstall = () => { const [, set] = useState(0); useEffect(() => { const f = () => set((x) => x + 1); subs.add(f); return () => subs.delete(f); }, []); return deferred; };
async function installNow() {
  const p = deferred; if (!p) return false;
  deferred = null; emit();
  p.prompt();
  const { outcome } = await p.userChoice.catch(() => ({}));
  return outcome === 'accepted';
}

export function installSteps(ua = navigator.userAgent, touch = navigator.maxTouchPoints || 0) {
  const ipad = /ipad/i.test(ua) || (/macintosh/i.test(ua) && touch > 1);
  const ios = /iphone|ipod/i.test(ua) || ipad;
  const inApp = /FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Line\/|Snapchat|TikTok|musical_ly|; wv\)/i.test(ua);
  const B = (t) => html`<b>${t}</b>`;
  if (ios) {
    if (inApp) return html`Öppna sidan i ${B('Safari')} först (via ${B('···')} eller ${B('Dela')}), sedan ${B('Dela')} → ${B('Lägg till på hemskärmen')}.`;
    if (/CriOS/i.test(ua)) return html`Tryck på ${B('Dela ⬆︎')} uppe till höger, scrolla ner och välj ${B('Lägg till på hemskärmen')}.`;
    if (/FxiOS|EdgiOS/i.test(ua)) return html`Tryck på menyn ${B('☰')} längst ner, välj ${B('Dela')} och sedan ${B('Lägg till på hemskärmen')}.`;
    if (ipad) return html`Tryck på ${B('Dela ⬆︎')} uppe till höger och välj ${B('Lägg till på hemskärmen')}.`;
    return html`Tryck på ${B('Dela ⬆︎')} längst ner (eller ${B('···')} → ${B('Dela')}), scrolla ner och välj ${B('Lägg till på hemskärmen')}.`;
  }
  if (/android/i.test(ua)) {
    if (inApp) return html`Öppna sidan i ${B('Chrome')} först (via ${B('⋮')}), sedan ${B('⋮')} → ${B('Lägg till på startskärmen')}.`;
    if (/SamsungBrowser/i.test(ua)) return html`Tryck på menyn ${B('≡')} längst ner och välj ${B('Lägg till sida på')} → ${B('Startskärm')}.`;
    if (/Firefox/i.test(ua)) return html`Tryck på ${B('⋮')} och välj ${B('Lägg till på startskärmen')}.`;
    return html`Tryck på ${B('⋮')} uppe till höger och välj ${B('Lägg till på startskärmen')} eller ${B('Installera app')}.`;
  }
  return null;   // dator: visas bara om webbläsaren kan installera med en knapp
}


const flag = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const setFlag = (k, v = '1') => { try { localStorage.setItem(k, v); } catch { /* ok */ } };

// Den lilla rutan överst i flödet (tills man stänger den eller har sparat appen).
export function InstallHint() {
  const prompt = useInstall();
  const [closed, setClosed] = useState(() => flag('install-hint-closed') === '1');
  const steps = installSteps();
  if (isStandalone() || closed || (!steps && !prompt)) return null;
  const close = () => { setFlag('install-hint-closed'); setClosed(true); };
  return html`<div class="install-hint">
    <img src="icons/icon-192.png" alt="" width="40" height="40" />
    <span><strong>Spara som app</strong><br />${prompt ? 'Få appen på startskärmen med ett tryck.' : steps}</span>
    ${prompt && html`<button class="btn small primary" onClick=${async () => (await installNow()) && close()}>Installera</button>`}
    <button class="iconbtn" aria-label="Stäng" onClick=${close}><${Icon} name="x" size=${18} /></button>
  </div>`;
}

// Frågan som visas en stund efter att appen öppnats i webbläsaren (inte i den sparade appen).
// Avböjer man visas den igen tidigast om en vecka.
const WEEK = 7 * 864e5;
export function InstallSheet() {
  const prompt = useInstall();
  const [show, setShow] = useState(false);
  const ios = /iphone|ipad/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const steps = installSteps();
  useEffect(() => {
    if (isStandalone() || Date.now() - Number(flag('install-sheet-later') || 0) < WEEK) return;
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, []);
  if (!show || isStandalone() || (!steps && !prompt)) return null;
  const later = () => { setFlag('install-sheet-later', String(Date.now())); setShow(false); };
  return html`<div class="modal-bg sheet-bg install-bg" onClick=${(e) => e.target === e.currentTarget && later()}>
    <div class="sheet install-sheet" role="dialog" aria-label="Spara appen på hemskärmen">
      <img src="icons/icon-192.png" alt="" width="64" height="64" />
      <h2>Spara Omställningsplatser på hemskärmen</h2>
      <p class="muted">Då öppnas den som en vanlig app, i helskärm och med notiser – och den är lätt att hitta.</p>
      ${prompt ? html`<button class="btn primary block" onClick=${async () => { if (await installNow()) setShow(false); }}>Installera</button>`
        : html`<div class="install-steps">${steps}</div>`}
      <button class="btn block" onClick=${later}>Inte nu</button>
      ${ios && !prompt && html`<div class="install-arrow" aria-hidden="true">↓</div>`}
    </div>
  </div>`;
}
