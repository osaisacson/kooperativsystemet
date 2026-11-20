-- 014: Låsta grupper (Omställningsplatser), medlemskap som följer Redaktionen, och bildtexter bort ur hämtade beskrivningar.

-- ---------- Låsta grupper ----------
-- En låst grupp går inte att gå med i själv. Gruppen Omställningsplatser är låst och dess medlemmar är Redaktionen.
alter table public.groups add column if not exists locked boolean not null default false;
update public.groups set locked = true where name = 'Omställningsplatser';

drop policy if exists "öppet att gå med" on public.group_members;
create policy "öppet att gå med" on public.group_members for insert to authenticated
  with check (user_id = auth.uid() and role = 'member'
    and not exists (select 1 from public.groups g where g.id = group_id and g.locked));

-- Medlemmarna i den låsta gruppen följer Redaktionen: läggs någon till eller tas bort där, följer gruppen med.
create or replace function public.sync_editor_group() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into group_members (group_id, user_id, role)
    select g.id, new.user_id, 'admin' from groups g where g.locked and g.name = 'Omställningsplatser'
    on conflict (group_id, user_id) do update set role = 'admin';
    return new;
  else
    delete from group_members gm using groups g
    where gm.group_id = g.id and g.locked and g.name = 'Omställningsplatser' and gm.user_id = old.user_id;
    return old;
  end if;
end $$;
drop trigger if exists editors_sync_group on public.editors;
create trigger editors_sync_group after insert or delete on public.editors
  for each row execute function public.sync_editor_group();

-- Bara Redaktionen ska vara med: Åsa Isacson och Erik Berg.
delete from public.group_members gm using public.groups g
where gm.group_id = g.id and g.name = 'Omställningsplatser' and gm.user_id not in (select user_id from public.editors);
insert into public.group_members (group_id, user_id, role)
select g.id, e.user_id, 'admin' from public.groups g, public.editors e where g.name = 'Omställningsplatser'
on conflict (group_id, user_id) do update set role = 'admin';

-- ---------- Bildtexter ur hämtade beskrivningar ----------
-- T.ex. "Screenshot 2022-06-21 at 16.04.23 1416×950 201 KB" eller "Boihop kollektivhus 1000×720 144 KB" före själva texten.
create or replace function pg_temp.utan_bildtexter(t text) returns text language plpgsql as $$
declare s text := coalesce(t, ''); m text;
begin
  loop
    m := substring(s from '^(.*?\d{2,5}×\d{2,5}\s+[0-9.,]+\s*[KM]B)');
    exit when m is null or length(m) > 170;
    s := ltrim(substr(s, length(m) + 1));
  end loop;
  s := regexp_replace(s, '([.!?…]\s+)[^.!?]{0,140}?\d{2,5}×\d{2,5}\s+[0-9.,]+\s*[KM]B\s*', '\1', 'g');
  return btrim(regexp_replace(s, '\s{2,}', ' ', 'g'));
end $$;
update public.groups set description = pg_temp.utan_bildtexter(description)
where description ~ '\d{2,5}×\d{2,5}\s+[0-9.,]+\s*[KM]B';

select (select string_agg(p.name, ', ') from public.group_members gm join public.groups g on g.id = gm.group_id join public.profiles p on p.id = gm.user_id
        where g.name = 'Omställningsplatser') as medlemmar,
       (select count(*) from public.groups where description ~ '\d{2,5}×\d{2,5}\s+[0-9.,]+\s*[KM]B') as bildtexter_kvar;
