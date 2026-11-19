-- Uppdatering: ansökningar görs för en grupp, kommentarer kan besvaras i trådar, riktiga exempelbilder.
-- (Nya installationer behöver inte köra den här – setup.sql innehåller redan ändringarna.)
alter table public.comments add column if not exists group_id uuid references public.groups(id) on delete set null;
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;

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

drop function if exists public.apply_for_funding(uuid, text, numeric, text);
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

drop policy if exists "vanliga kommentarer" on public.comments;
create policy "vanliga kommentarer" on public.comments for insert to authenticated
  with check (author_id = auth.uid() and status is null and applied_amount is null and group_id is null);

-- Exempeldata: grupper för ansökningarna, nya svar och riktiga bilder
update public.comments set group_id = 'b0000000-0000-4000-8000-000000000004' where id = 'd0000000-0000-4000-8000-000000000003';
update public.comments set group_id = 'b0000000-0000-4000-8000-000000000001' where id = 'd0000000-0000-4000-8000-000000000004';
update public.comments set group_id = 'b0000000-0000-4000-8000-000000000001' where id = 'd0000000-0000-4000-8000-000000000006';
insert into public.comments (id, post_id, author_id, parent_id, body, created_at) select 'd0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000005', 'Ja, om flera hushåll delar på den. Sök som grupp och berätta hur många som ska använda den.', now() - interval '5 hours' where exists (select 1 from public.comments where id = 'd0000000-0000-4000-8000-000000000005') on conflict (id) do nothing;
insert into public.comments (id, post_id, author_id, parent_id, body, created_at) select 'd0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000011', 'Toppen! Vi är fyra hushåll i Gottsunda – vi skriver ihop en ansökan i helgen.', now() - interval '4 hours' where exists (select 1 from public.comments where id = 'd0000000-0000-4000-8000-000000000011') on conflict (id) do nothing;
insert into public.comments (id, post_id, author_id, parent_id, body, created_at) select 'd0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000002', 'Smart. Hur stor är tanken?', now() - interval '3 hours' where exists (select 1 from public.comments where id = 'd0000000-0000-4000-8000-000000000002') on conflict (id) do nothing;
delete from public.notifications where post_id in ('c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010');
update public.posts set last_activity_at = now() - interval '3 hours' where id = 'c0000000-0000-4000-8000-000000000001';
update public.posts set last_activity_at = now() - interval '4 hours' where id = 'c0000000-0000-4000-8000-000000000002';
update public.posts set last_activity_at = now() - interval '9 hours' where id = 'c0000000-0000-4000-8000-000000000003';
update public.posts set last_activity_at = now() - interval '18 hours' where id = 'c0000000-0000-4000-8000-000000000004';
update public.posts set last_activity_at = now() - interval '45 hours' where id = 'c0000000-0000-4000-8000-000000000005';
update public.posts set last_activity_at = now() - interval '3 hours' where id = 'c0000000-0000-4000-8000-000000000006';
update public.posts set last_activity_at = now() - interval '9 hours' where id = 'c0000000-0000-4000-8000-000000000007';
update public.posts set last_activity_at = now() - interval '70 hours' where id = 'c0000000-0000-4000-8000-000000000008';
update public.posts set last_activity_at = now() - interval '7 hours' where id = 'c0000000-0000-4000-8000-000000000009';
update public.posts set last_activity_at = now() - interval '40 hours' where id = 'c0000000-0000-4000-8000-000000000010';
update public.groups set avatar_url = 'https://images.unsplash.com/photo-1525542419642-fb8c7259a04c?w=400&h=400&fit=crop&q=80&auto=format' where id = 'b0000000-0000-4000-8000-000000000001' and avatar_url like 'seed/%';
update public.groups set avatar_url = 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&h=400&fit=crop&q=80&auto=format' where id = 'b0000000-0000-4000-8000-000000000002' and avatar_url like 'seed/%';
update public.groups set avatar_url = 'https://images.unsplash.com/photo-1716903282677-3a1b5c936b41?w=400&h=400&fit=crop&q=80&auto=format' where id = 'b0000000-0000-4000-8000-000000000003' and avatar_url like 'seed/%';
update public.groups set avatar_url = 'https://images.unsplash.com/photo-1499744349893-0c6de53516e6?w=400&h=400&fit=crop&q=80&auto=format' where id = 'b0000000-0000-4000-8000-000000000004' and avatar_url like 'seed/%';
update public.groups set avatar_url = 'https://images.unsplash.com/photo-1467842976472-03f46c6b1e3d?w=400&h=400&fit=crop&q=80&auto=format' where id = 'b0000000-0000-4000-8000-000000000005' and avatar_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1592483335937-a3213ac4a833?w=1080&h=1080&fit=crop&q=80&auto=format', text = '1. Vi grävde en bädd på 2 × 6 meter, 80 cm djup, och lade i en tät duk.' where id = 'f0000001-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1632199670702-3ea3f70909cb?w=1080&h=1080&fit=crop&q=80&auto=format', text = '2. Tvättad singel i botten, sand ovanpå. Fördelningsrör längs ena kortsidan.' where id = 'f0000001-0000-4000-8000-000000000001' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1600772066490-18c330d042c8?w=1080&h=1080&fit=crop&q=80&auto=format', text = '3. Planterade bladvass. Efter en säsong renar den allt bad- och diskvatten från fem hushåll.' where id = 'f0000001-0000-4000-8000-000000000002' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1655300256335-beef51a914fe?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Paneler på ett av husen i kvarteret – nu vill vi hjälpa fler att komma igång.' where id = 'f0000002-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1788296817269-8df0458ab799?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Hyvelbänken och väggen med handverktyg.' where id = 'f0000003-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1492496913980-501348b61469?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Maskarna har jobbat sedan i mars.' where id = 'f0000004-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1675134768072-d700f38ceef0?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Blandning i baljor – testa alltid en provyta först.' where id = 'f0000005-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1559173525-d16dfd7c17fe?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Första lagret på halmbalsväggen, ca 2 cm.' where id = 'f0000005-0000-4000-8000-000000000001' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1715274036728-4385d95a5e9f?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Spadar och skottkärror står redo.' where id = 'f0000006-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1605522283494-4901a98d458e?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'En veckas matrester från trapphuset – i bokashin blir de jord på några veckor.' where id = 'f0000007-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1660330589243-4c640d878052?w=1080&h=1080&fit=crop&q=80&auto=format', text = '24 paneler, 9,6 kW.' where id = 'f0000008-0000-4000-8000-000000000000' and image_url like 'seed/%';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1606859191214-25806e8e2423?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Plats för storinköp, sorterat per familj.' where id = 'f0000010-0000-4000-8000-000000000000' and image_url like 'seed/%';
