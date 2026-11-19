// Väljer backend: Supabase om config.js är ifylld, annars demoläge i webbläsaren.
// Lägg till ?demo i adressen för att prova demoläget även när Supabase är inkopplat.
// Båda filerna exporterar samma funktioner, så resten av appen bryr sig inte om vilken som används.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const demo = new URLSearchParams(location.search).has('demo') || !(SUPABASE_URL && SUPABASE_ANON_KEY);
const mod = demo ? await import('./local.js') : await import('./supabase.js');
export const api = mod.api;
