// Demoläge: samma funktioner som supabase.js men allt sparas i webbläsarens localStorage.
// Reglerna här speglar reglerna i supabase/setup.sql.
import { materializeSeed } from '../seed.js';
import { financeSummary, visibleInFeed, normalizePostInput, normalizeUrl, sortCategories, resizeImage, blobToDataURL } from '../util.js';

const KEY = 'kooperativsystemet-demo-v2';
const subs = new Set();
const fresh = () => ({ ...materializeSeed(), credentials: {}, session: null, notifications: [], messages: [] });

function persist(d = db) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); }
  catch { throw new Error('Demolagringen i webbläsaren är full. Använd färre/mindre bilder eller koppla in Supabase.'); }
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* börja om */ }
  const d = fresh();
  try { persist(d); } catch { /* fortsätt utan att spara */ }
  return d;
}
let db = load();

const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const clone = (x) => JSON.parse(JSON.stringify(x));
const emit = () => subs.forEach((f) => f());

function needMe() { if (!db.session) throw new Error('Du är inte inloggad.'); return db.session; }
const membership = (gid, uid) => db.members.find((m) => m.group_id === gid && m.user_id === uid);
function needMember(gid) { const me = needMe(); if (!membership(gid, me)) throw new Error('Bara gruppens medlemmar kan göra det.'); return me; }
function needAdmin(gid) { const me = needMe(); if (membership(gid, me)?.role !== 'admin') throw new Error('Bara gruppens admins kan göra det.'); return me; }

const profileOf = (id) => {
  const p = db.profiles.find((x) => x.id === id);
  return p ? { id: p.id, name: p.name, avatar_url: p.avatar_url } : { id, name: 'Borttagen användare', avatar_url: null };
};
const groupOf = (id) => {
  const g = id && db.groups.find((x) => x.id === id);
  return g ? { id: g.id, name: g.name, avatar_url: g.avatar_url } : null;
};

function shapePost(p) {
  const cs = db.comments.filter((c) => c.post_id === p.id);
  return clone({
    ...p, slides: [...p.slides].sort((a, b) => a.position - b.position),
    author: profileOf(p.author_id), group: groupOf(p.group_id),
    comment_count: cs.length, finance: financeSummary(p, cs), first_comment: firstComment(cs),
  });
}
function firstComment(cs) {
  const c = cs.filter((x) => !x.parent_id).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  return c ? { body: c.body, author: profileOf(c.author_id), group: groupOf(c.group_id) } : null;
}
function bump(post) {
  const t = now();
  post.last_activity_at = t;
  const g = post.group_id && db.groups.find((x) => x.id === post.group_id);
  if (g) g.last_activity_at = t;
}
function notify(user_id, kind, body, extra = {}) {
  db.notifications.push({ id: uuid(), user_id, kind, body, actor_id: extra.actor_id ?? null,
    post_id: extra.post_id ?? null, group_id: extra.group_id ?? null, read: false, created_at: now() });
}
function ensureAdmin(gid) {
  const ms = db.members.filter((m) => m.group_id === gid);
  if (!ms.length || ms.some((m) => m.role === 'admin')) return;
  const m = ms.sort((a, b) => a.joined_at.localeCompare(b.joined_at))[0];
  m.role = 'admin';
  notify(m.user_id, 'admin', `Du är nu admin för ${groupOf(gid).name} eftersom gruppen saknade admin.`, { group_id: gid });
}
const usedAmount = (pid) => db.comments
  .filter((c) => c.post_id === pid && (c.status === 'granted' || c.status === 'paid'))
  .reduce((s, c) => s + Number(c.applied_amount), 0);

async function storeImage(file, max = 1080) { return blobToDataURL(await resizeImage(file, max, 0.72)); }
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
async function buildSlides(slides) {
  const out = [];
  for (const [i, s] of slides.entries()) {
    out.push({ id: s.id || uuid(), position: i, image_url: s.file ? await storeImage(s.file) : s.image_url, text: (s.text || '').trim() });
  }
  return out;
}
function addCategories(cats) {
  for (const c of cats) if (!db.categories.some((x) => x.name.toLowerCase() === c.toLowerCase())) db.categories.push({ name: c, created_at: now() });
}

export const api = {
  mode: 'demo',

  // ---- Konto ----
  onAuthChange(cb) { subs.add(cb); return () => subs.delete(cb); },
  async getMe() { return db.session ? clone(db.profiles.find((p) => p.id === db.session) || null) : null; },
  async signUp({ email, password, name, nickname, avatarFile }) {
    email = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Ange en giltig e-postadress.');
    if (!name.trim()) throw new Error('Skriv ditt namn.');
    if (password.length < 6) throw new Error('Lösenordet måste vara minst 6 tecken.');
    if (db.credentials[email]) throw new Error('Det finns redan ett konto med den e-postadressen.');
    const id = uuid();
    const avatar_url = avatarFile ? await storeImage(avatarFile, 400) : null;
    db.profiles.push({ id, name: name.trim(), nickname: (nickname || '').trim() || null, avatar_url, created_at: now(), last_seen_at: now() });
    db.credentials[email] = { id, hash: await sha(password) };
    db.session = id;
    persist(); emit();
    return { needsConfirmation: false };
  },
  async signIn({ email, password }) {
    const c = db.credentials[email.trim().toLowerCase()];
    if (!c || c.hash !== await sha(password)) throw new Error('Fel e-post eller lösenord.');
    db.session = c.id; persist(); emit();
  },
  async signOut() { db.session = null; persist(); emit(); },
  isRecovering() { return false; },
  async signInWithProvider() { throw new Error('Inloggning med Google/Apple fungerar bara med Supabase.'); },
  async requestPasswordReset() { throw new Error('I demoläget skickas inga mejl. Skapa ett nytt konto i stället.'); },
  async setNewPassword() {},
  async touch() { const p = db.profiles.find((x) => x.id === db.session); if (p) { p.last_seen_at = now(); persist(); } },
  async updateProfile({ name, nickname, avatarFile }) {
    const p = db.profiles.find((x) => x.id === needMe());
    if (name?.trim()) p.name = name.trim();
    if (nickname !== undefined) p.nickname = nickname.trim() || null;
    if (avatarFile) p.avatar_url = await storeImage(avatarFile, 400);
    persist();
  },
  async resetDemo() { db = fresh(); persist(); emit(); },

  // ---- Personer ----
  async listUsers(q = '') {
    q = q.trim().toLowerCase();
    return db.profiles.filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'sv')).map((p) => profileOf(p.id));
  },
  async getUser(id) {
    const p = db.profiles.find((x) => x.id === id);
    if (!p) throw new Error('Användaren finns inte.');
    return clone({ ...profileOf(id), nickname: p.nickname || null, created_at: p.created_at,
      groups: db.members.filter((m) => m.user_id === id).map((m) => ({ ...groupOf(m.group_id), role: m.role })) });
  },

  // ---- Grupper ----
  async listGroups(q = '') {
    const me = db.session; q = q.trim().toLowerCase();
    return clone(db.groups.filter((g) => !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q))
      .sort((a, b) => b.last_activity_at.localeCompare(a.last_activity_at))
      .map((g) => ({ ...g, member_count: db.members.filter((m) => m.group_id === g.id).length, is_member: !!membership(g.id, me) })));
  },
  async myGroups() {
    const me = needMe();
    return db.members.filter((m) => m.user_id === me).map((m) => ({ ...groupOf(m.group_id), role: m.role }))
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  },
  async getGroup(id) {
    const g = db.groups.find((x) => x.id === id);
    if (!g) throw new Error('Gruppen finns inte.');
    const members = db.members.filter((m) => m.group_id === id)
      .sort((a, b) => (a.role === b.role ? a.joined_at.localeCompare(b.joined_at) : a.role === 'admin' ? -1 : 1))
      .map((m) => ({ user: profileOf(m.user_id), role: m.role, joined_at: m.joined_at }));
    const highlights = db.highlights.filter((h) => h.group_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at));
    return clone({ ...g, members, highlights });
  },
  async createGroup({ name, description, homepage, avatarFile }) {
    const me = needMe();
    name = (name || '').trim();
    if (!name) throw new Error('Ge gruppen ett namn.');
    if (db.groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) throw new Error('Det finns redan en grupp med det namnet.');
    const g = { id: uuid(), name, description: (description || '').trim(), homepage: normalizeUrl(homepage), avatar_url: avatarFile ? await storeImage(avatarFile, 400) : null,
      created_by: me, created_at: now(), last_activity_at: now() };
    db.groups.push(g);
    db.members.push({ group_id: g.id, user_id: me, role: 'admin', joined_at: now() });
    persist();
    return clone(g);
  },
  async updateGroup(id, { name, description, homepage, avatarFile }) {
    needAdmin(id);
    const g = db.groups.find((x) => x.id === id);
    if (name?.trim()) g.name = name.trim();
    if (description !== undefined) g.description = description.trim();
    if (homepage !== undefined) g.homepage = normalizeUrl(homepage);
    if (avatarFile) g.avatar_url = await storeImage(avatarFile, 400);
    persist();
  },
  async deleteGroup(id) {
    needAdmin(id);
    for (const p of db.posts.filter((x) => x.group_id === id)) await api.deletePost(p.id);
    db.highlights = db.highlights.filter((h) => h.group_id !== id);
    db.members = db.members.filter((m) => m.group_id !== id);
    db.groups = db.groups.filter((g) => g.id !== id);
    db.notifications = db.notifications.filter((n) => n.group_id !== id);
    persist();
  },
  async joinGroup(id) {
    const me = needMe();
    if (!membership(id, me)) db.members.push({ group_id: id, user_id: me, role: 'member', joined_at: now() });
    persist();
  },
  async leaveGroup(id) {
    const me = needMe();
    db.members = db.members.filter((m) => !(m.group_id === id && m.user_id === me));
    ensureAdmin(id); persist();
  },
  async setMemberRole(gid, uid, role) {
    const me = needAdmin(gid);
    const m = membership(gid, uid);
    if (!m) return;
    const was = m.role;
    m.role = role === 'admin' ? 'admin' : 'member';
    if (m.role === 'admin' && was !== 'admin' && uid !== me) notify(uid, 'admin', `gjorde dig till admin för ${groupOf(gid).name}`, { actor_id: me, group_id: gid });
    ensureAdmin(gid); persist();
  },
  async removeMember(gid, uid) {
    if (uid !== needMe()) needAdmin(gid);
    db.members = db.members.filter((m) => !(m.group_id === gid && m.user_id === uid));
    ensureAdmin(gid); persist();
  },
  async saveHighlight(gid, { id, title, post_ids }) {
    needMember(gid);
    if (!title?.trim()) throw new Error('Ge höjdpunkten ett namn.');
    const h = id && db.highlights.find((x) => x.id === id);
    if (h) { h.title = title.trim(); h.post_ids = post_ids; }
    else db.highlights.push({ id: uuid(), group_id: gid, title: title.trim(), post_ids, created_at: now() });
    persist();
  },
  async deleteHighlight(id) {
    const h = db.highlights.find((x) => x.id === id);
    if (!h) return;
    needMember(h.group_id);
    db.highlights = db.highlights.filter((x) => x.id !== id);
    persist();
  },

  // ---- Inlägg ----
  async listCategories() { return sortCategories(db.categories.map((c) => c.name)); },
  async listPosts({ resources = false, category = null, groupId = null, authorId = null, q = '', feed = false } = {}) {
    q = q.trim().toLowerCase();
    let ps = db.posts.filter((p) =>
      (!resources || p.is_resource) && (!category || p.categories.includes(category)) &&
      (!groupId || p.group_id === groupId) && (!authorId || p.author_id === authorId) &&
      (!q || p.caption.toLowerCase().includes(q) || p.slides.some((s) => s.text.toLowerCase().includes(q))));
    ps = ps.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(shapePost);
    return feed ? ps.filter(visibleInFeed) : ps;
  },
  async getPost(id) {
    const p = db.posts.find((x) => x.id === id);
    if (!p) throw new Error('Inlägget finns inte (längre).');
    const me = db.session;
    const post = shapePost(p);
    post.comments = db.comments.filter((c) => c.post_id === id).sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({ ...clone(c), author: profileOf(c.author_id), group: groupOf(c.group_id),
        payout: c.author_id === me || p.author_id === me ? db.payouts[c.id] ?? null : null }));
    return post;
  },
  async createPost(input) {
    const me = needMe();
    const v = normalizePostInput(input);
    if (v.groupId && !membership(v.groupId, me)) throw new Error('Du kan bara posta i grupper du är med i.');
    const t = now();
    const post = {
      id: uuid(), author_id: me, group_id: v.groupId, caption: v.caption, is_resource: v.isResource, categories: v.categories,
      fin_total: v.finance?.total ?? null, fin_mode: v.finance?.mode ?? null, fin_expires_at: v.finance?.expiresAt ?? null, fin_closed: false,
      created_at: t, updated_at: t, last_activity_at: t, slides: await buildSlides(v.slides),
    };
    addCategories(v.categories);
    db.posts.push(post); bump(post); persist();
    return post.id;
  },
  async updatePost(id, input) {
    const me = needMe();
    const p = db.posts.find((x) => x.id === id);
    if (!p || p.author_id !== me) throw new Error('Bara den som postat kan redigera.');
    const v = normalizePostInput(input);
    if (p.fin_total != null && !v.finance) throw new Error('Ett finansieringsinlägg kan inte byta typ. Stäng det i stället via ··· på inlägget.');
    if (v.groupId && v.groupId !== p.group_id && !membership(v.groupId, me)) throw new Error('Du kan bara posta i grupper du är med i.');
    Object.assign(p, { group_id: v.groupId, caption: v.caption, is_resource: v.isResource, categories: v.categories, updated_at: now() });
    if (v.finance) {
      if (p.fin_total == null) Object.assign(p, { fin_total: v.finance.total, fin_mode: v.finance.mode });
      p.fin_expires_at = v.finance.expiresAt;
    }
    p.slides = await buildSlides(v.slides);
    addCategories(v.categories); persist();
  },
  async deletePost(id) {
    const me = needMe();
    const p = db.posts.find((x) => x.id === id);
    if (!p) return;
    if (p.author_id !== me && !(p.group_id && membership(p.group_id, me)?.role === 'admin')) throw new Error('Du får inte ta bort det här inlägget.');
    const cids = new Set(db.comments.filter((c) => c.post_id === id).map((c) => c.id));
    db.posts = db.posts.filter((x) => x.id !== id);
    db.comments = db.comments.filter((c) => !cids.has(c.id));
    for (const cid of cids) delete db.payouts[cid];
    db.notifications = db.notifications.filter((n) => n.post_id !== id);
    for (const h of db.highlights) h.post_ids = h.post_ids.filter((x) => x !== id);
    persist();
  },
  async setFinanceClosed(id, closed) {
    const p = db.posts.find((x) => x.id === id);
    if (!p || p.author_id !== needMe()) throw new Error('Bara den som postat kan ändra.');
    p.fin_closed = !!closed; persist();
  },

  // ---- Kommentarer och finansiering ----
  async addComment(postId, body, parentId = null) {
    const me = needMe();
    body = (body || '').trim();
    if (!body) throw new Error('Skriv något först.');
    const p = db.posts.find((x) => x.id === postId);
    const parent = parentId && db.comments.find((c) => c.id === parentId);
    if (parentId && parent?.post_id !== postId) throw new Error('Svaret hör inte till samma inlägg.');
    db.comments.push({ id: uuid(), post_id: postId, author_id: me, group_id: null, parent_id: parentId || null, body, created_at: now(), applied_amount: null, status: null });
    bump(p);
    if (p.author_id !== me) notify(p.author_id, 'comment', `${parent ? 'svarade i en tråd på ditt inlägg' : 'kommenterade'}: ${body.slice(0, 80)}`, { actor_id: me, post_id: postId });
    if (parent && parent.author_id !== me && parent.author_id !== p.author_id) notify(parent.author_id, 'reply', `svarade på din kommentar: ${body.slice(0, 80)}`, { actor_id: me, post_id: postId });
    persist();
  },
  async applyForFunding(postId, { groupId, body, amount, payout }) {
    const me = needMe();
    if (!groupId || !membership(groupId, me)) throw new Error('Välj en grupp du är med i att söka för.');
    const p = db.posts.find((x) => x.id === postId);
    if (!p || p.fin_total == null) throw new Error('Inlägget är ingen finansiering.');
    if (p.author_id === me) throw new Error('Du kan inte söka från din egen finansiering.');
    if (p.fin_closed || (p.fin_expires_at && new Date(p.fin_expires_at) < new Date())) throw new Error('Finansieringen är stängd.');
    const amt = p.fin_mode === 'single' ? Number(p.fin_total) : Number(amount);
    if (!(amt > 0)) throw new Error('Ange ett belopp.');
    const left = Number(p.fin_total) - usedAmount(postId);
    if (amt > left) throw new Error(`Beloppet är större än det som finns kvar (${left} kr).`);
    if (!body?.trim()) throw new Error('Skriv en motivering.');
    if (!payout?.trim()) throw new Error('Ange swishnummer eller bankkonto.');
    const c = { id: uuid(), post_id: postId, author_id: me, group_id: groupId, parent_id: null, body: body.trim(), created_at: now(), applied_amount: amt, status: 'applied' };
    db.comments.push(c);
    db.payouts[c.id] = payout.trim();
    bump(p);
    notify(p.author_id, 'application', `ansökte om ${amt} kr för ${groupOf(groupId).name}`, { actor_id: me, post_id: postId });
    persist();
  },
  async decideApplication(commentId, decision) {
    const me = needMe();
    const c = db.comments.find((x) => x.id === commentId);
    const p = c && db.posts.find((x) => x.id === c.post_id);
    if (!p || p.author_id !== me) throw new Error('Bara den som delar ut pengarna kan besluta.');
    if (c.status !== 'applied') throw new Error('Ansökan är redan behandlad.');
    if (decision === 'granted' && Number(c.applied_amount) > Number(p.fin_total) - usedAmount(p.id)) throw new Error('Det finns inte tillräckligt kvar för att bevilja.');
    c.status = decision === 'granted' ? 'granted' : 'denied';
    c.decided_at = now();
    notify(c.author_id, 'decision', c.status === 'granted' ? `beviljade din ansökan på ${c.applied_amount} kr` : 'avslog din ansökan', { actor_id: me, post_id: p.id });
    persist();
  },
  async markPaid(commentId) {
    const me = needMe();
    const c = db.comments.find((x) => x.id === commentId);
    const p = c && db.posts.find((x) => x.id === c.post_id);
    if (!p || p.author_id !== me) throw new Error('Bara den som delar ut pengarna kan markera utbetalningar.');
    if (c.status !== 'granted') throw new Error('Ansökan är inte beviljad.');
    c.status = 'paid'; c.paid_at = now();
    notify(c.author_id, 'paid', `har skickat ${c.applied_amount} kr till dig`, { actor_id: me, post_id: p.id });
    persist();
  },
  async listTodos() {
    const me = needMe();
    const mine = new Set(db.posts.filter((p) => p.author_id === me).map((p) => p.id));
    return db.comments.filter((c) => mine.has(c.post_id) && (c.status === 'granted' || c.status === 'paid'))
      .sort((a, b) => (b.decided_at || '').localeCompare(a.decided_at || ''))
      .map((c) => {
        const p = db.posts.find((x) => x.id === c.post_id);
        return { ...clone(c), author: profileOf(c.author_id), group: groupOf(c.group_id), payout: db.payouts[c.id] ?? null, post: { id: p.id, caption: p.caption, group: groupOf(p.group_id) } };
      });
  },

  // ---- Notiser ----
  async listNotifications() {
    const me = needMe();
    return db.notifications.filter((n) => n.user_id === me).sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100)
      .map((n) => ({ ...clone(n), actor: n.actor_id ? profileOf(n.actor_id) : null }));
  },
  async markNotificationsRead() {
    const me = needMe();
    for (const n of db.notifications) if (n.user_id === me) n.read = true;
    persist();
  },

  // ---- Meddelanden ----
  async listConversations() {
    const me = needMe();
    const map = new Map();
    for (const m of [...db.messages].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
      if (m.from_id !== me && m.to_id !== me) continue;
      const other = m.from_id === me ? m.to_id : m.from_id;
      if (!map.has(other)) map.set(other, { user: profileOf(other), last: clone(m), unread: 0 });
      if (m.to_id === me && !m.read) map.get(other).unread++;
    }
    return [...map.values()];
  },
  async getThread(userId) {
    const me = needMe();
    const msgs = db.messages.filter((m) => (m.from_id === me && m.to_id === userId) || (m.from_id === userId && m.to_id === me));
    for (const m of msgs) if (m.to_id === me) m.read = true;
    persist();
    return clone(msgs.sort((a, b) => a.created_at.localeCompare(b.created_at)));
  },
  async sendMessage(userId, body) {
    const me = needMe();
    if (!body?.trim()) throw new Error('Skriv något först.');
    if (userId === me) throw new Error('Du kan inte skicka till dig själv.');
    db.messages.push({ id: uuid(), from_id: me, to_id: userId, body: body.trim(), read: false, created_at: now() });
    persist();
  },

  async badges() {
    const me = db.session;
    if (!me) return { notifications: 0, messages: 0, todos: 0 };
    const mine = new Set(db.posts.filter((p) => p.author_id === me).map((p) => p.id));
    return {
      notifications: db.notifications.filter((n) => n.user_id === me && !n.read).length,
      messages: db.messages.filter((m) => m.to_id === me && !m.read).length,
      todos: db.comments.filter((c) => mine.has(c.post_id) && c.status === 'granted').length,
    };
  },
};
