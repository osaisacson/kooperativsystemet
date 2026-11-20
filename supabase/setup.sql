-- =====================================================================
-- Kooperativsystemet – databas för Supabase
-- Klistra in hela filen i Supabase → SQL Editor → Run.
-- Kör sedan seed.sql om du vill ha exempeldata.
-- =====================================================================

-- ---------- Tabeller --------------------------------------------------

create table public.profiles (
  id uuid primary key,                      -- samma id som auth.users (exempelanvändare saknar inloggning)
  name text not null,
  nickname text,
  avatar_url text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  homepage text,
  imported_from text,              -- t.ex. 'byggemenskaper.se': hämtad därifrån, visas med en banner tills gruppen fått en egen admin
  country text,                              -- land, region och stad: flödet kan visas per plats
  region text,
  city text,
  address text,                              -- gatuadress eller område, visas på kartan
  postcode text,
  lat double precision,
  lng double precision,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  succession_notified_at timestamptz         -- när admins mejlades om att gruppen saknar aktiv admin
);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.highlights (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  post_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.categories (
  name text primary key,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,
  caption text not null default '',
  kind text not null default 'vanlig' check (kind in ('vanlig', 'finansiering', 'lokal')),
  is_resource boolean not null default false,  -- något andra kan ha nytta av (har ämnen, är finansiering eller lokal)
  categories text[] not null default '{}',     -- ämnen, t.ex. Energi, Byggmetod, Off-grid
  space_functions text[] not null default '{}', -- lokaler: vad lokalen kan användas till
  space_cost text check (space_cost in ('gratis', 'gentjanst', 'kostar')),
  space_price text,
  is_event boolean not null default false,     -- evenemang: datum, tid, plats och anmälan
  event_start timestamptz,
  event_end timestamptz,
  event_address text,
  event_postcode text,
  event_city text,
  event_region text,
  event_country text,
  event_lat double precision,
  event_lng double precision,
  event_rsvp boolean not null default true,   -- får folk anmäla intresse?
  fin_total numeric check (fin_total is null or fin_total > 0),
  fin_mode text check (fin_mode in ('single', 'split')),
  fin_expires_at timestamptz,
  fin_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_group_idx on public.posts (group_id);
create index posts_author_idx on public.posts (author_id);

create table public.post_slides (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  position int not null default 0,
  image_url text not null,
  text text not null default ''
);
create index post_slides_post_idx on public.post_slides (post_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  group_id uuid references public.groups(id) on delete set null,      -- ansökningar görs i en grupps namn
  parent_id uuid references public.comments(id) on delete cascade,    -- svar i tråd
  body text not null,
  created_at timestamptz not null default now(),
  applied_amount numeric,                      -- satt om kommentaren är en ansökan
  status text check (status in ('applied', 'granted', 'denied', 'paid')),
  decided_at timestamptz,
  paid_at timestamptz
);
create index comments_post_idx on public.comments (post_id);

-- Swishnummer/bankkonto. Syns bara för den som sökt och den som delar ut.
create table public.payouts (
  comment_id uuid primary key references public.comments(id) on delete cascade,
  details text not null
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,                          -- comment | application | decision | paid | admin
  actor_id uuid references public.profiles(id) on delete set null,
  post_id uuid references public.posts(id) on delete cascade,
  group_id uuid references public.groups(id) on delete cascade,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index messages_to_idx on public.messages (to_id, created_at desc);
create index messages_from_idx on public.messages (from_id, created_at desc);

-- Mejl som ska skickas (t.ex. när en grupp saknar aktiv admin). Se README.
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

insert into public.categories (name) values ('Energi'), ('Byggmetod'), ('Off-grid'), ('Vatten'), ('Avfall'), ('Mat'), ('Ekonomi');

-- ---------- Hjälpfunktioner -------------------------------------------

create or replace function public.is_member(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

create or replace function public.is_admin(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid() and role = 'admin');
$$;

-- ---------- Triggers ---------------------------------------------------

-- Ny inloggning → ny profil (namnet skickas med vid registrering)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into profiles (id, name, nickname, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(m->>'name'), ''), nullif(trim(m->>'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(m->>'nickname'), ''),
    coalesce(nullif(m->>'avatar_url', ''), nullif(m->>'picture', ''))   -- profilbild från Google
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Den som skapar en grupp blir admin
create or replace function public.on_group_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into group_members (group_id, user_id, role) values (new.id, new.created_by, 'admin')
    on conflict (group_id, user_id) do update set role = 'admin';
  end if;
  return new;
end $$;
create trigger group_created after insert on public.groups
  for each row execute function public.on_group_created();

-- Nytt inlägg = aktivitet i gruppen
create or replace function public.on_post_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.group_id is not null then
    update groups set last_activity_at = now() where id = new.group_id;
  end if;
  return new;
end $$;
create trigger post_created after insert on public.posts
  for each row execute function public.on_post_created();

-- Ny kommentar = aktivitet på inlägget och i gruppen, + notiser
create or replace function public.on_comment_created() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_post posts; v_parent comments; v_group text;
begin
  select * into v_post from posts where id = new.post_id;
  if new.parent_id is not null then
    select * into v_parent from comments where id = new.parent_id;
    if v_parent.post_id is distinct from new.post_id then raise exception 'Svaret hör inte till samma inlägg.'; end if;
  end if;
  update posts set last_activity_at = now() where id = new.post_id;
  if v_post.group_id is not null then
    update groups set last_activity_at = now() where id = v_post.group_id;
  end if;
  if v_post.author_id <> new.author_id then
    select name into v_group from groups where id = new.group_id;
    insert into notifications (user_id, kind, actor_id, post_id, body)
    values (
      v_post.author_id,
      case when new.status = 'applied' then 'application' else 'comment' end,
      new.author_id, new.post_id,
      case when new.status = 'applied' then 'ansökte om ' || new.applied_amount || ' kr för ' || coalesce(v_group, 'sin grupp')
           when new.parent_id is not null then 'svarade i en tråd på ditt inlägg: ' || left(new.body, 80)
           else 'kommenterade: ' || left(new.body, 80) end
    );
  end if;
  if v_parent.id is not null and v_parent.author_id <> new.author_id and v_parent.author_id <> v_post.author_id then
    insert into notifications (user_id, kind, actor_id, post_id, body)
    values (v_parent.author_id, 'reply', new.author_id, new.post_id, 'svarade på din kommentar: ' || left(new.body, 80));
  end if;
  return new;
end $$;
create trigger comment_created after insert on public.comments
  for each row execute function public.on_comment_created();

-- En grupp med medlemmar ska alltid ha minst en admin.
-- Lämnar sista admin → den som varit med längst blir admin.
create or replace function public.ensure_group_admin() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_gid uuid; v_user uuid; v_name text;
begin
  v_gid := case when tg_op = 'DELETE' then old.group_id else new.group_id end;
  if not exists (select 1 from groups where id = v_gid) then return null; end if;
  if exists (select 1 from group_members where group_id = v_gid and role = 'admin') then return null; end if;
  select user_id into v_user from group_members where group_id = v_gid order by joined_at limit 1;
  if v_user is null then return null; end if;
  perform set_config('app.auto_promote', '1', true);
  update group_members set role = 'admin' where group_id = v_gid and user_id = v_user;
  perform set_config('app.auto_promote', '', true);
  select name into v_name from groups where id = v_gid;
  insert into notifications (user_id, kind, group_id, body)
  values (v_user, 'admin', v_gid, 'Du är nu admin för ' || v_name || ' eftersom gruppen saknade admin.');
  return null;
end $$;
create trigger group_members_admin after delete or update on public.group_members
  for each row execute function public.ensure_group_admin();

-- Notis när någon görs till admin
create or replace function public.on_admin_granted() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.role = 'admin' and old.role <> 'admin' and auth.uid() is not null and auth.uid() <> new.user_id
     and coalesce(current_setting('app.auto_promote', true), '') <> '1' then
    select name into v_name from groups where id = new.group_id;
    insert into notifications (user_id, kind, actor_id, group_id, body)
    values (new.user_id, 'admin', auth.uid(), new.group_id, 'gjorde dig till admin för ' || v_name);
  end if;
  return new;
end $$;
create trigger group_members_admin_granted after update on public.group_members
  for each row execute function public.on_admin_granted();

-- ---------- Funktioner som appen anropar ------------------------------

-- Markera att man är aktiv (används för att se om admins är inaktiva)
create or replace function public.touch() returns void
language sql security definer set search_path = public as $$
  update profiles set last_seen_at = now() where id = auth.uid();
$$;

create or replace function public.apply_for_funding(p_post uuid, p_group uuid, p_body text, p_amount numeric, p_payout text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_post posts; v_used numeric; v_amount numeric := p_amount; v_id uuid;
begin
  if auth.uid() is null then raise exception 'Du måste vara inloggad.'; end if;
  if p_group is null or not exists (select 1 from group_members where group_id = p_group and user_id = auth.uid()) then
    raise exception 'Välj en grupp du är med i att söka för.';
  end if;
  select * into v_post from posts where id = p_post;
  if v_post.id is null or v_post.fin_total is null then raise exception 'Inlägget är ingen finansiering.'; end if;
  if v_post.author_id = auth.uid() then raise exception 'Du kan inte söka från din egen finansiering.'; end if;
  if v_post.fin_closed or (v_post.fin_expires_at is not null and v_post.fin_expires_at < now()) then
    raise exception 'Finansieringen är stängd.';
  end if;
  if v_post.fin_mode = 'single' then v_amount := v_post.fin_total; end if;
  if v_amount is null or v_amount <= 0 then raise exception 'Ange ett belopp.'; end if;
  select coalesce(sum(applied_amount), 0) into v_used from comments where post_id = p_post and status in ('granted', 'paid');
  if v_amount > v_post.fin_total - v_used then
    raise exception 'Beloppet är större än det som finns kvar (% kr).', v_post.fin_total - v_used;
  end if;
  if coalesce(trim(p_body), '') = '' then raise exception 'Skriv en motivering.'; end if;
  if coalesce(trim(p_payout), '') = '' then raise exception 'Ange swishnummer eller bankkonto.'; end if;
  insert into comments (post_id, author_id, group_id, body, applied_amount, status)
  values (p_post, auth.uid(), p_group, trim(p_body), v_amount, 'applied') returning id into v_id;
  insert into payouts (comment_id, details) values (v_id, trim(p_payout));
  return v_id;
end $$;

create or replace function public.decide_application(p_comment uuid, p_decision text)
returns void language plpgsql security definer set search_path = public as $$
declare v_c comments; v_post posts; v_used numeric;
begin
  select * into v_c from comments where id = p_comment;
  select * into v_post from posts where id = v_c.post_id;
  if v_post.author_id is distinct from auth.uid() then raise exception 'Bara den som delar ut pengarna kan besluta.'; end if;
  if v_c.status is distinct from 'applied' then raise exception 'Ansökan är redan behandlad.'; end if;
  if p_decision not in ('granted', 'denied') then raise exception 'Ogiltigt beslut.'; end if;
  if p_decision = 'granted' then
    select coalesce(sum(applied_amount), 0) into v_used from comments where post_id = v_post.id and status in ('granted', 'paid');
    if v_c.applied_amount > v_post.fin_total - v_used then raise exception 'Det finns inte tillräckligt kvar för att bevilja.'; end if;
  end if;
  update comments set status = p_decision, decided_at = now() where id = p_comment;
  insert into notifications (user_id, kind, actor_id, post_id, body)
  values (v_c.author_id, 'decision', auth.uid(), v_post.id,
          case when p_decision = 'granted' then 'beviljade din ansökan på ' || v_c.applied_amount || ' kr'
               else 'avslog din ansökan' end);
  -- Den som sökt får ett meddelande (syns under meddelanden uppe till höger)
  insert into messages (from_id, to_id, body)
  values (auth.uid(), v_c.author_id,
          case when p_decision = 'granted'
               then 'Er ansökan på ' || v_c.applied_amount || ' kr har beviljats. Jag hör av mig när pengarna är skickade. #/post/' || v_post.id
               else 'Er ansökan på ' || v_c.applied_amount || ' kr fick tyvärr avslag den här gången. #/post/' || v_post.id end);
end $$;

create or replace function public.mark_paid(p_comment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_c comments; v_post posts;
begin
  select * into v_c from comments where id = p_comment;
  select * into v_post from posts where id = v_c.post_id;
  if v_post.author_id is distinct from auth.uid() then raise exception 'Bara den som delar ut pengarna kan markera utbetalningar.'; end if;
  if v_c.status is distinct from 'granted' then raise exception 'Ansökan är inte beviljad.'; end if;
  update comments set status = 'paid', paid_at = now() where id = p_comment;
  insert into notifications (user_id, kind, actor_id, post_id, body)
  values (v_c.author_id, 'paid', auth.uid(), v_post.id, 'har skickat ' || v_c.applied_amount || ' kr till dig');
  insert into messages (from_id, to_id, body)
  values (auth.uid(), v_c.author_id, 'Nu har jag skickat ' || v_c.applied_amount || ' kr till er. #/post/' || v_post.id);
end $$;

-- Körs varje natt (se cron.sql). Om en grupp inte haft någon aktiv admin på ett år:
-- 1) admins mejlas, 2) efter 30 dagar utan reaktion blir den som varit medlem längst admin.
create or replace function public.admin_succession() returns void
language plpgsql security definer set search_path = public as $$
declare g record; v_user uuid;
begin
  for g in select * from groups loop
    if exists (
      select 1 from group_members m join profiles p on p.id = m.user_id
      where m.group_id = g.id and m.role = 'admin' and p.last_seen_at > now() - interval '1 year'
    ) then
      if g.succession_notified_at is not null then
        update groups set succession_notified_at = null where id = g.id;
      end if;
    elsif g.succession_notified_at is null then
      insert into email_outbox (to_email, subject, body)
      select u.email,
             'Gruppen ' || g.name || ' saknar aktiv admin',
             'Hej! Ingen admin i ' || g.name || ' har loggat in på ett år. Om ingen admin loggar in inom 30 dagar blir den medlem som varit med längst admin. Logga in för att behålla din roll.'
      from group_members m join auth.users u on u.id = m.user_id
      where m.group_id = g.id and m.role = 'admin' and u.email is not null;
      update groups set succession_notified_at = now() where id = g.id;
    elsif g.succession_notified_at < now() - interval '30 days' then
      select m.user_id into v_user
      from group_members m join profiles p on p.id = m.user_id
      where m.group_id = g.id and m.role = 'member' and p.last_seen_at > now() - interval '1 year'
      order by m.joined_at limit 1;
      if v_user is not null then
        perform set_config('app.auto_promote', '1', true);
        update group_members set role = 'admin' where group_id = g.id and user_id = v_user;
        perform set_config('app.auto_promote', '', true);
        insert into notifications (user_id, kind, group_id, body)
        values (v_user, 'admin', g.id, 'Du är nu admin för ' || g.name || ' eftersom gruppen saknat aktiv admin i ett år.');
      end if;
      update groups set succession_notified_at = null where id = g.id;
    end if;
  end loop;
end $$;
revoke execute on function public.admin_succession() from public, anon, authenticated;

-- ---------- Behörigheter (Row Level Security) -------------------------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.highlights enable row level security;
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.post_slides enable row level security;
alter table public.comments enable row level security;
alter table public.payouts enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.email_outbox enable row level security;   -- inga regler = bara servern kommer åt

create policy "profiler syns för inloggade" on public.profiles for select to authenticated using (true);
create policy "egen profil kan ändras" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "grupper syns" on public.groups for select to authenticated using (true);
create policy "alla kan skapa grupper" on public.groups for insert to authenticated with check (created_by = auth.uid());
create policy "admins ändrar grupp" on public.groups for update to authenticated using (public.is_admin(id));
create policy "admins tar bort grupp" on public.groups for delete to authenticated using (public.is_admin(id));

create policy "medlemskap syns" on public.group_members for select to authenticated using (true);
create policy "öppet att gå med" on public.group_members for insert to authenticated with check (user_id = auth.uid() and role = 'member');
create policy "admins ändrar roller" on public.group_members for update to authenticated using (public.is_admin(group_id));
create policy "lämna eller ta bort" on public.group_members for delete to authenticated using (user_id = auth.uid() or public.is_admin(group_id));

create policy "höjdpunkter syns" on public.highlights for select to authenticated using (true);
create policy "medlemmar skapar höjdpunkter" on public.highlights for insert to authenticated with check (public.is_member(group_id));
create policy "medlemmar ändrar höjdpunkter" on public.highlights for update to authenticated using (public.is_member(group_id));
create policy "medlemmar tar bort höjdpunkter" on public.highlights for delete to authenticated using (public.is_member(group_id));

create policy "kategorier syns" on public.categories for select to authenticated using (true);
create policy "alla kan skapa kategorier" on public.categories for insert to authenticated with check (length(trim(name)) between 1 and 40);

create policy "inlägg syns" on public.posts for select to authenticated using (true);
create policy "posta själv, i egna grupper" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (group_id is null or public.is_member(group_id)));
create policy "författaren ändrar" on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid() and (group_id is null or public.is_member(group_id)));
create policy "författaren eller gruppadmin tar bort" on public.posts for delete to authenticated
  using (author_id = auth.uid() or (group_id is not null and public.is_admin(group_id)));

create policy "bilder syns" on public.post_slides for select to authenticated using (true);
create policy "författaren hanterar bilder" on public.post_slides for all to authenticated
  using (exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "kommentarer syns" on public.comments for select to authenticated using (true);
create policy "vanliga kommentarer" on public.comments for insert to authenticated
  with check (author_id = auth.uid() and status is null and applied_amount is null and group_id is null);
create policy "ta bort egen kommentar" on public.comments for delete to authenticated
  using (author_id = auth.uid() and (status is null or status in ('applied', 'denied')));

create policy "utbetalningsuppgifter syns för båda parter" on public.payouts for select to authenticated using (
  exists (select 1 from comments c join posts p on p.id = c.post_id
          where c.id = comment_id and (c.author_id = auth.uid() or p.author_id = auth.uid()))
);

create policy "egna notiser" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "markera notiser lästa" on public.notifications for update to authenticated using (user_id = auth.uid());

create policy "egna meddelanden" on public.messages for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());
create policy "skicka meddelanden" on public.messages for insert to authenticated with check (from_id = auth.uid() and to_id <> auth.uid());
create policy "markera meddelanden lästa" on public.messages for update to authenticated using (to_id = auth.uid());

-- Långtidsminnet: vem som vill spara vilket inlägg.
create table public.memory_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.memory_votes enable row level security;
create policy "minnesröster syns" on public.memory_votes for select to authenticated using (true);
create policy "rösta själv" on public.memory_votes for insert to authenticated with check (user_id = auth.uid());
create policy "ta tillbaka egen röst" on public.memory_votes for delete to authenticated using (user_id = auth.uid());

-- Evenemang: vem som är intresserad eller kommer.
create table public.event_rsvps (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('interested', 'going')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.event_rsvps enable row level security;
create policy "anmälningar syns" on public.event_rsvps for select to authenticated using (true);
create policy "anmäl dig själv" on public.event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "ändra egen anmälan" on public.event_rsvps for update to authenticated using (user_id = auth.uid());
create policy "ta bort egen anmälan" on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

-- ---------- Kalenderprenumeration och push-notiser ----------------

-- Inställningar som bara servern når (inga regler = ingen åtkomst från appen)
create table if not exists public.app_settings (key text primary key, value text not null);
alter table public.app_settings enable row level security;

-- Varje person får en hemlig kalenderlänk
create table if not exists public.user_secrets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  calendar_token uuid not null unique default gen_random_uuid()
);
alter table public.user_secrets enable row level security;
drop policy if exists "egen hemlighet" on public.user_secrets;
create policy "egen hemlighet" on public.user_secrets for select to authenticated using (user_id = auth.uid());

create or replace function public.my_calendar_token() returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if auth.uid() is null then raise exception 'Du måste vara inloggad.'; end if;
  insert into user_secrets (user_id) values (auth.uid()) on conflict (user_id) do nothing;
  select calendar_token into v from user_secrets where user_id = auth.uid();
  return v;
end $$;

-- Telefoner/webbläsare som vill ha push
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists "egna push-prenumerationer" on public.push_subscriptions;
create policy "egna push-prenumerationer" on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Nytt meddelande eller ny ansökan → be serverfunktionen skicka en push
create extension if not exists pg_net;
create or replace function public.notify_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  if tg_table_name = 'comments' then
    -- bara ansökningar (vanliga kommentarer ger ingen push); läses via to_jsonb eftersom meddelanden saknar fältet
    if (to_jsonb(new) ->> 'status') is distinct from 'applied' then return new; end if;
  end if;
  select value into v_url from app_settings where key = 'push_url';
  select value into v_secret from app_settings where key = 'push_secret';
  if v_url is null or v_secret is null then return new; end if;
  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('type', tg_table_name, 'id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret)
  );
  return new;
end $$;
drop trigger if exists push_on_message on public.messages;
create trigger push_on_message after insert on public.messages for each row execute function public.notify_push();
drop trigger if exists push_on_application on public.comments;
create trigger push_on_application after insert on public.comments for each row execute function public.notify_push();

-- ---------- Bildlagring ------------------------------------------------

insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

create policy "ladda upp egna bilder" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "bilder är publika" on storage.objects for select using (bucket_id = 'media');
create policy "ta bort egna bilder" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
