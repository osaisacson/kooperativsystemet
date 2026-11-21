-- 016: Gruppens admins kan lägga till medlemmar, och publicera inlägg som gruppen ("via Namn").

-- Inlägg som gruppen: bara gruppens admins får välja det.
alter table public.posts add column if not exists as_group boolean not null default false;

drop policy if exists "posta själv, i egna grupper" on public.posts;
create policy "posta själv, i egna grupper" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (group_id is null or public.is_member(group_id))
    and (not as_group or (group_id is not null and public.is_admin(group_id))));
drop policy if exists "författaren ändrar" on public.posts;
create policy "författaren ändrar" on public.posts for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and (group_id is null or public.is_member(group_id))
    and (not as_group or (group_id is not null and public.is_admin(group_id))));

-- Lägg till en medlem (bara gruppens admins, inte i låsta grupper). Personen får en notis.
create or replace function public.add_member(p_group uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g groups;
begin
  select * into g from groups where id = p_group;
  if g.id is null then raise exception 'Gruppen finns inte.'; end if;
  if not public.is_admin(p_group) then raise exception 'Bara gruppens admins kan lägga till medlemmar.'; end if;
  if g.locked then raise exception 'Gruppen är låst – medlemmarna är Redaktionen.'; end if;
  if not exists (select 1 from profiles where id = p_user) then raise exception 'Personen finns inte.'; end if;
  insert into group_members (group_id, user_id, role) values (p_group, p_user, 'member') on conflict do nothing;
  if found and p_user <> auth.uid() then
    insert into notifications (user_id, kind, actor_id, group_id, body) values (p_user, 'admin', auth.uid(), p_group, 'lade till dig i ' || g.name);
  end if;
end $$;

select 'klart' as resultat;
