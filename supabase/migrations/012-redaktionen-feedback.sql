-- 012: Redaktionen (moderering), anmälningar, historik, feedback på appen och radera eget konto.
-- Redaktionen representerar gruppen Omställningsplatser, som ansvarar för plattformen.
-- Allt Redaktionen gör går via funktionerna nedan, så att det alltid hamnar i historiken.

-- ---------- Redaktionen ----------
create table if not exists public.editors (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  added_by uuid references public.profiles(id) on delete set null,
  added_at timestamptz not null default now()
);
alter table public.editors enable row level security;
drop policy if exists "redaktionen syns" on public.editors;
create policy "redaktionen syns" on public.editors for select to authenticated using (true);

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from editors where user_id = auth.uid())
$$;

-- ---------- Anmälningar ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('post', 'group', 'user', 'feedback')),
  target_id uuid not null,
  target_name text,
  reason text not null check (length(trim(reason)) between 1 and 1000),
  reporter_id uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  done_at timestamptz,
  done_by uuid references public.profiles(id) on delete set null
);
alter table public.reports enable row level security;
drop policy if exists "anmäl" on public.reports;
create policy "anmäl" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and done_at is null);
drop policy if exists "redaktionen ser anmälningar" on public.reports;
create policy "redaktionen ser anmälningar" on public.reports for select to authenticated using (public.is_editor() or reporter_id = auth.uid());

-- ---------- Historik ----------
create table if not exists public.editor_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,          -- report_done | editor_add | editor_remove | delete_post | delete_group | delete_user | delete_feedback | feedback_status
  target_id uuid,
  summary text not null,
  created_at timestamptz not null default now(),
  reverted_at timestamptz,
  reverted_by uuid references public.profiles(id) on delete set null
);
alter table public.editor_log enable row level security;
drop policy if exists "redaktionen ser historiken" on public.editor_log;
create policy "redaktionen ser historiken" on public.editor_log for select to authenticated using (public.is_editor());

create or replace function public.need_editor() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from editors where user_id = auth.uid()) then
    raise exception 'Bara Redaktionen kan göra det.';
  end if;
end $$;

-- Ny anmälan → notis till Redaktionen
create or replace function public.on_report() returns trigger
language plpgsql security definer set search_path = public as $$
declare what text := case new.kind when 'post' then 'ett inlägg' when 'group' then 'gruppen ' || coalesce(new.target_name, '')
  when 'user' then coalesce(new.target_name, 'en användare') else 'ett feedbackinlägg' end;
begin
  insert into notifications (user_id, kind, actor_id, post_id, group_id, body)
  select e.user_id, 'report', new.reporter_id,
    case when new.kind = 'post' then new.target_id end, case when new.kind = 'group' then new.target_id end,
    'anmälde ' || what || ': ”' || left(new.reason, 120) || '” – finns i Redaktionens checklista'
  from editors e where e.user_id is distinct from new.reporter_id;
  return new;
end $$;
drop trigger if exists report_created on public.reports;
create trigger report_created after insert on public.reports for each row execute function public.on_report();

-- Bocka av / öppna en anmälan igen
create or replace function public.set_report_done(p_id uuid, p_done boolean) returns void
language plpgsql security definer set search_path = public as $$
declare r reports;
begin
  perform need_editor();
  select * into r from reports where id = p_id;
  if r.id is null then raise exception 'Anmälan finns inte.'; end if;
  update reports set done_at = case when p_done then now() end, done_by = case when p_done then auth.uid() end where id = p_id;
  if p_done then
    insert into editor_log (actor_id, action, target_id, summary)
    values (auth.uid(), 'report_done', p_id, 'bockade av anmälan om ' || coalesce(r.target_name, 'innehåll') || ': ”' || left(r.reason, 80) || '”');
  end if;
end $$;

-- Lägg till eller ta bort någon ur Redaktionen
create or replace function public.set_editor(p_user uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  perform need_editor();
  select name into n from profiles where id = p_user;
  if n is null then raise exception 'Personen finns inte.'; end if;
  if p_on then
    if exists (select 1 from editors where user_id = p_user) then return; end if;
    insert into editors (user_id, added_by) values (p_user, auth.uid());
    insert into editor_log (actor_id, action, target_id, summary) values (auth.uid(), 'editor_add', p_user, 'lade till ' || n || ' i Redaktionen');
    insert into notifications (user_id, kind, actor_id, body) values (p_user, 'admin', auth.uid(), 'lade till dig i Redaktionen');
  else
    if not exists (select 1 from editors where user_id = p_user) then return; end if;
    if (select count(*) from editors) <= 1 then raise exception 'Redaktionen måste ha minst en person.'; end if;
    delete from editors where user_id = p_user;
    insert into editor_log (actor_id, action, target_id, summary) values (auth.uid(), 'editor_remove', p_user, 'tog bort ' || n || ' ur Redaktionen');
  end if;
end $$;

-- Ta bort inlägg, grupp, användare eller feedback (går inte att ångra)
create or replace function public.editor_delete(p_kind text, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  perform need_editor();
  if p_kind = 'post' then
    select coalesce(nullif(left(caption, 60), ''), 'inlägg') into n from posts where id = p_id;
    delete from posts where id = p_id;
  elsif p_kind = 'group' then
    select name into n from groups where id = p_id;
    delete from posts where group_id = p_id;
    delete from groups where id = p_id;
  elsif p_kind = 'user' then
    if p_id = auth.uid() then raise exception 'Ta bort ditt eget konto under Hjälp → Radera ditt konto.'; end if;
    select name into n from profiles where id = p_id;
    delete from profiles where id = p_id;
    delete from auth.users where id = p_id;
  elsif p_kind = 'feedback' then
    select left(title, 60) into n from feedback where id = p_id;
    delete from feedback where id = p_id;
  else raise exception 'Okänd typ.';
  end if;
  if n is null then raise exception 'Det finns inte (längre).'; end if;
  -- Anmälningar om det som togs bort bockas av
  update reports set done_at = now(), done_by = auth.uid() where target_id = p_id and done_at is null;
  insert into editor_log (actor_id, action, target_id, summary)
  values (auth.uid(), 'delete_' || p_kind, p_id, 'tog bort ' || case p_kind when 'post' then 'inlägget ”' || n || '”'
    when 'group' then 'gruppen ' || n when 'user' then 'användaren ' || n else 'feedbacken ”' || n || '”' end);
end $$;

-- Ångra något i historiken (det som togs bort kan inte ångras)
create or replace function public.revert_log(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare l editor_log;
begin
  perform need_editor();
  select * into l from editor_log where id = p_id;
  if l.id is null or l.reverted_at is not null then raise exception 'Redan ångrat.'; end if;
  if l.action = 'report_done' then
    update reports set done_at = null, done_by = null where id = l.target_id;
  elsif l.action = 'editor_add' then
    if (select count(*) from editors) <= 1 then raise exception 'Redaktionen måste ha minst en person.'; end if;
    delete from editors where user_id = l.target_id;
  elsif l.action = 'editor_remove' then
    insert into editors (user_id, added_by) values (l.target_id, auth.uid()) on conflict do nothing;
  elsif l.action = 'feedback_status' then
    update feedback set status = null where id = l.target_id;
  else raise exception 'Det här går inte att ångra.';
  end if;
  update editor_log set reverted_at = now(), reverted_by = auth.uid() where id = p_id;
  -- Den som gjorde det får veta att det ångrades
  if l.actor_id is distinct from auth.uid() then
    insert into notifications (user_id, kind, actor_id, body) values (l.actor_id, 'admin', auth.uid(), 'ångrade att du ' || l.summary);
  end if;
end $$;

-- ---------- Radera eget konto ----------
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'Du är inte inloggad.'; end if;
  if exists (select 1 from editors where user_id = me) and (select count(*) from editors) <= 1 then
    raise exception 'Du är sista personen i Redaktionen. Lägg till någon annan först.';
  end if;
  delete from profiles where id = me;
  delete from auth.users where id = me;
end $$;

-- ---------- Feedback på appen ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  title text not null check (length(trim(title)) between 3 and 140),
  body text not null default '' check (length(body) <= 4000),
  status text check (status in ('planerad', 'klar', 'inte nu')),
  created_at timestamptz not null default now()
);
create table if not exists public.feedback_votes (
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  value smallint not null check (value in (-1, 1)),
  primary key (feedback_id, user_id)
);
create table if not exists public.feedback_comments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_comments enable row level security;
drop policy if exists "feedback syns" on public.feedback;
create policy "feedback syns" on public.feedback for select to authenticated using (true);
drop policy if exists "skriv feedback" on public.feedback;
create policy "skriv feedback" on public.feedback for insert to authenticated with check (author_id = auth.uid() and status is null);
drop policy if exists "ta bort egen feedback" on public.feedback;
create policy "ta bort egen feedback" on public.feedback for delete to authenticated using (author_id = auth.uid());
drop policy if exists "röster syns" on public.feedback_votes;
create policy "röster syns" on public.feedback_votes for select to authenticated using (true);
drop policy if exists "egen röst" on public.feedback_votes;
create policy "egen röst" on public.feedback_votes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "feedbackkommentarer syns" on public.feedback_comments;
create policy "feedbackkommentarer syns" on public.feedback_comments for select to authenticated using (true);
drop policy if exists "kommentera feedback" on public.feedback_comments;
create policy "kommentera feedback" on public.feedback_comments for insert to authenticated with check (author_id = auth.uid());
drop policy if exists "ta bort egen feedbackkommentar" on public.feedback_comments;
create policy "ta bort egen feedbackkommentar" on public.feedback_comments for delete to authenticated using (author_id = auth.uid() or public.is_editor());

-- Redaktionen sätter status (planerad, klar, inte nu) – syns för alla
create or replace function public.set_feedback_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare f feedback;
begin
  perform need_editor();
  select * into f from feedback where id = p_id;
  if f.id is null then raise exception 'Finns inte.'; end if;
  update feedback set status = p_status where id = p_id;
  if p_status is not null then
    insert into editor_log (actor_id, action, target_id, summary)
    values (auth.uid(), 'feedback_status', p_id, 'satte ”' || left(f.title, 60) || '” som ' || p_status);
    if f.author_id <> auth.uid() then
      insert into notifications (user_id, kind, actor_id, body) values (f.author_id, 'admin', auth.uid(), 'markerade din feedback ”' || left(f.title, 60) || '” som ' || p_status);
    end if;
  end if;
end $$;

-- ---------- Startuppsättning: gruppen Omställningsplatser och Redaktionen ----------
-- Åsa Isacson och Erik Berg är med från start.
insert into public.editors (user_id)
select id from public.profiles where name in ('Åsa Isacson', 'Erik Berg')
on conflict do nothing;

insert into public.groups (name, description, created_by)
select 'Omställningsplatser',
  'Gruppen som ansvarar för plattformen Omställningsplatser. Redaktionen representerar gruppen. Alla som vill vara med och utveckla plattformen är välkomna.',
  (select id from public.profiles where name = 'Åsa Isacson' limit 1)
where not exists (select 1 from public.groups where name = 'Omställningsplatser');
insert into public.group_members (group_id, user_id, role)
select g.id, e.user_id, 'admin' from public.groups g, public.editors e where g.name = 'Omställningsplatser'
on conflict (group_id, user_id) do update set role = 'admin';

select (select string_agg(p.name, ', ') from public.editors e join public.profiles p on p.id = e.user_id) as redaktionen,
  (select count(*) from public.groups where name = 'Omställningsplatser') as grupp;
