// Väljer backend: Supabase om config.js är ifylld, annars demoläge i webbläsaren.
// Båda filerna exporterar samma funktioner, så resten av appen bryr sig inte om vilken som används.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const mod = SUPABASE_URL && SUPABASE_ANON_KEY ? await import('./supabase.js') : await import('./local.js');
export const api = mod.api;
