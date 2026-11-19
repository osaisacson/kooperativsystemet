// Skapar supabase/seed.sql från js/seed.js:  node tools/build-seed-sql.mjs
import { writeFileSync } from 'node:fs';
import { SEED, activityHours, slideId } from '../js/seed.js';

const lit = (v) => (v === null || v === undefined ? 'null'
  : typeof v === 'number' || typeof v === 'boolean' ? String(v)
  : `'${String(v).replace(/'/g, "''")}'`);
const arr = (xs, type) => (xs?.length ? `array[${xs.map(lit).join(', ')}]::${type}[]` : `'{}'::${type}[]`);
const ago = (h) => `now() - interval '${h} hours'`;
const rows = (table, cols, values) =>
  `insert into public.${table} (${cols.join(', ')}) values\n  ${values.map((v) => `(${v.join(', ')})`).join(',\n  ')};\n`;

const act = activityHours();
let sql = `-- Exempeldata. Skapad av tools/build-seed-sql.mjs – ändra i js/seed.js och kör skriptet igen.
-- Exempelanvändarna har inga inloggningar; skapa egna konton i appen för att testa.\n\n`;

sql += rows('categories', ['name'], SEED.categories.map((c) => [lit(c)])).replace(/;\n$/, ' on conflict (name) do nothing;\n');

sql += rows('profiles', ['id', 'name', 'created_at', 'last_seen_at'],
  SEED.profiles.map((p) => [lit(p.id), lit(p.name), ago(p.h), ago(p.seen)]));

// created_by sätts efteråt så att triggern inte lägger till skaparen som admin två gånger
sql += rows('groups', ['id', 'name', 'description', 'avatar_url', 'country', 'region', 'city', 'created_at', 'last_activity_at'],
  SEED.groups.map((g) => [lit(g.id), lit(g.name), lit(g.description), lit(g.avatar_url), lit(g.country), lit(g.region), lit(g.city), ago(g.h), ago(act.groups[g.id] ?? g.h)]));
sql += SEED.groups.map((g) => `update public.groups set created_by = ${lit(g.created_by)} where id = ${lit(g.id)};`).join('\n') + '\n';

sql += rows('group_members', ['group_id', 'user_id', 'role', 'joined_at'],
  SEED.members.map((m) => [lit(m.g), lit(m.u), lit(m.role || 'member'), ago(m.h)]));

sql += rows('posts', ['id', 'author_id', 'group_id', 'caption', 'kind', 'is_resource', 'categories', 'space_functions', 'space_cost', 'fin_total', 'fin_mode', 'fin_expires_at', 'created_at', 'updated_at', 'last_activity_at'],
  SEED.posts.map((p) => [lit(p.id), lit(p.author_id), lit(p.group_id), lit(p.caption), lit(p.kind || 'vanlig'), lit(!!(p.kind || p.tags?.length)), arr(p.tags, 'text'),
    arr(p.space_functions, 'text'), lit(p.space_cost ?? null),
    lit(p.fin_total ?? null), lit(p.fin_mode ?? null), p.expires_days != null ? `now() + interval '${p.expires_days} days'` : 'null',
    ago(p.h), ago(p.h), ago(act.posts[p.id])]));

const slides = SEED.posts.flatMap((p) => p.slides.map((s, i) => [lit(slideId(p.id, i)), lit(p.id), i, lit(s.img), lit(s.text || '')]));
sql += rows('post_slides', ['id', 'post_id', 'position', 'image_url', 'text'], slides);

// Kommentarer läggs in utan notiser till exempelanvändarna (triggern skapar dem, vi rensar efteråt)
sql += rows('comments', ['id', 'post_id', 'author_id', 'group_id', 'parent_id', 'body', 'created_at', 'applied_amount', 'status', 'decided_at', 'paid_at'],
  SEED.comments.map((c) => [lit(c.id), lit(c.post_id), lit(c.author_id), lit(c.group_id ?? null), lit(c.parent_id ?? null), lit(c.body), ago(c.h), lit(c.amount ?? null), lit(c.status ?? null),
    c.status && c.status !== 'applied' ? ago(c.h - 1) : 'null', c.status === 'paid' ? ago(c.h - 2) : 'null']));
sql += rows('payouts', ['comment_id', 'details'], SEED.comments.filter((c) => c.payout).map((c) => [lit(c.id), lit(c.payout)]));

// Återställ aktivitetstider som triggers skrev över
sql += SEED.posts.map((p) => `update public.posts set last_activity_at = ${ago(act.posts[p.id])} where id = ${lit(p.id)};`).join('\n') + '\n';
sql += SEED.groups.map((g) => `update public.groups set last_activity_at = ${ago(act.groups[g.id] ?? g.h)} where id = ${lit(g.id)};`).join('\n') + '\n';
sql += `delete from public.notifications where post_id in (${SEED.posts.map((p) => lit(p.id)).join(', ')});\n`;

sql += rows('highlights', ['id', 'group_id', 'title', 'post_ids', 'created_at'],
  SEED.highlights.map((h) => [lit(h.id), lit(h.group_id), lit(h.title), arr(h.post_ids, 'uuid'), ago(h.h)]));

const out = new URL('../supabase/seed.sql', import.meta.url);
writeFileSync(out, sql);
console.log('Skrev', out.pathname);
