-- Uppdatering: evenemang (datum, tid, plats, anmälan), postnummer på grupper,
-- och meddelanden till den som sökt pengar när ansökan beviljas, avslås eller betalas ut.
alter table public.groups add column if not exists postcode text;
alter table public.posts add column if not exists is_event boolean not null default false;
alter table public.posts add column if not exists event_start timestamptz;
alter table public.posts add column if not exists event_end timestamptz;
alter table public.posts add column if not exists event_address text;
alter table public.posts add column if not exists event_postcode text;
alter table public.posts add column if not exists event_city text;
alter table public.posts add column if not exists event_region text;
alter table public.posts add column if not exists event_country text;
alter table public.posts add column if not exists event_lat double precision;
alter table public.posts add column if not exists event_lng double precision;
alter table public.posts add column if not exists event_rsvp boolean not null default true;

-- Evenemang: vem som är intresserad eller kommer.
create table if not exists public.event_rsvps (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('interested', 'going')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.event_rsvps enable row level security;
drop policy if exists "anmälningar syns" on public.event_rsvps;
drop policy if exists "anmäl dig själv" on public.event_rsvps;
drop policy if exists "ändra egen anmälan" on public.event_rsvps;
drop policy if exists "ta bort egen anmälan" on public.event_rsvps;
create policy "anmälningar syns" on public.event_rsvps for select to authenticated using (true);
create policy "anmäl dig själv" on public.event_rsvps for insert to authenticated with check (user_id = auth.uid());
create policy "ändra egen anmälan" on public.event_rsvps for update to authenticated using (user_id = auth.uid());
create policy "ta bort egen anmälan" on public.event_rsvps for delete to authenticated using (user_id = auth.uid());

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

-- Exempel: tre evenemang med anmälningar
insert into public.posts (id, author_id, group_id, caption, kind, is_resource, categories, created_at, updated_at, last_activity_at) values ('c0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000006', 'Odlingsträff i andelsodlingen. Vi planerar nästa säsong, delar frön och bjuder på soppa. Alla som är nyfikna på att starta en odling är välkomna.', 'vanlig', true, array['Mat']::text[], now() - interval '5 hours', now() - interval '5 hours', now() - interval '5 hours') on conflict (id) do nothing;
insert into public.post_slides (id, post_id, position, image_url, text) values ('f0000019-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000019', 0, 'https://images.unsplash.com/photo-1719763462298-dfd3ae24febc?w=1080&h=1080&fit=crop&q=80&auto=format', 'Odlingen i höstskrud.') on conflict (id) do nothing;
insert into public.posts (id, author_id, group_id, caption, kind, is_resource, categories, created_at, updated_at, last_activity_at) values ('c0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003', 'Studiekväll: vi bygger en kompostram i trä tillsammans och går igenom hur man tar hand om maskkompost. Ta med arbetshandskar.', 'vanlig', true, array['Byggmetod']::text[], now() - interval '9 hours', now() - interval '9 hours', now() - interval '9 hours') on conflict (id) do nothing;
insert into public.post_slides (id, post_id, position, image_url, text) values ('f0000020-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000020', 0, 'https://images.unsplash.com/photo-1659930087003-2d64e33181f7?w=1080&h=1080&fit=crop&q=80&auto=format', 'Vi mäter och sågar själva.') on conflict (id) do nothing;
update public.posts set is_event = true, event_start = (date_trunc('day', now() at time zone 'Europe/Stockholm') + interval '3 days 10 hours') at time zone 'Europe/Stockholm', event_end = (date_trunc('day', now() at time zone 'Europe/Stockholm') + interval '3 days 10 hours') at time zone 'Europe/Stockholm' + interval '5 hours', event_address = 'Gottsunda centrum, 756 47 Uppsala', event_postcode = '756 47', event_city = 'Uppsala', event_region = 'Uppsala län', event_country = 'Sverige', event_lat = 59.8095, event_lng = 17.623, event_rsvp = true where id = 'c0000000-0000-4000-8000-000000000006';
update public.posts set is_event = true, event_start = (date_trunc('day', now() at time zone 'Europe/Stockholm') + interval '6 days 13 hours') at time zone 'Europe/Stockholm', event_end = (date_trunc('day', now() at time zone 'Europe/Stockholm') + interval '6 days 13 hours') at time zone 'Europe/Stockholm' + interval '3 hours', event_address = 'Backa, 422 46 Hisingen', event_postcode = '422 46', event_city = 'Göteborg', event_region = 'Västra Götalands län', event_country = 'Sverige', event_lat = 57.747, event_lng = 11.971, event_rsvp = true where id = 'c0000000-0000-4000-8000-000000000019';
update public.posts set is_event = true, event_start = (date_trunc('day', now() at time zone 'Europe/Stockholm') + interval '10 days 18 hours') at time zone 'Europe/Stockholm', event_end = (date_trunc('day', now() at time zone 'Europe/Stockholm') + interval '10 days 18 hours') at time zone 'Europe/Stockholm' + interval '2 hours', event_address = 'Majorna, 414 63 Göteborg', event_postcode = '414 63', event_city = 'Göteborg', event_region = 'Västra Götalands län', event_country = 'Sverige', event_lat = 57.6905, event_lng = 11.916, event_rsvp = true where id = 'c0000000-0000-4000-8000-000000000020';
insert into public.event_rsvps (post_id, user_id, status) values ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'going'), ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'going'), ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'interested'), ('c0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000001', 'going'), ('c0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000006', 'interested'), ('c0000000-0000-4000-8000-000000000019', 'a0000000-0000-4000-8000-000000000002', 'interested'), ('c0000000-0000-4000-8000-000000000020', 'a0000000-0000-4000-8000-000000000003', 'going') on conflict do nothing;
update public.posts set caption = replace(caption, 'Grävdag på lördag kl 10 – vi förlänger', 'Grävdag! Vi förlänger') where id = 'c0000000-0000-4000-8000-000000000006';
