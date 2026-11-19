-- Uppdatering: långtidsminnet (röster på inlägg) och nytt exempel på lokal (Mikrofabriken i Göteborg).

-- Långtidsminnet: vem som vill spara vilket inlägg.
create table if not exists public.memory_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.memory_votes enable row level security;
drop policy if exists "minnesröster syns" on public.memory_votes;
drop policy if exists "rösta själv" on public.memory_votes;
drop policy if exists "ta tillbaka egen röst" on public.memory_votes;
create policy "minnesröster syns" on public.memory_votes for select to authenticated using (true);
create policy "rösta själv" on public.memory_votes for insert to authenticated with check (user_id = auth.uid());
create policy "ta tillbaka egen röst" on public.memory_votes for delete to authenticated using (user_id = auth.uid());

update public.posts set group_id = 'b0000000-0000-4000-8000-000000000003', author_id = 'a0000000-0000-4000-8000-000000000006',
  space_functions = '{Verkstad,Ateljé}', space_cost = 'kostar', space_price = 'Se deras hemsida',
  caption = 'Tips för alla i Göteborg: Mikrofabriken är en delad verkstad där man kan använda maskiner och verktyg man inte har själv. Bra ställe att bygga prototyper eller laga saker tillsammans. Kolla deras hemsida för öppettider och vad det kostar.'
  where id = 'c0000000-0000-4000-8000-000000000010';
update public.post_slides set image_url = 'https://images.unsplash.com/photo-1759523146335-0069847ceb16?w=1080&h=1080&fit=crop&q=80&auto=format', text = 'Delade maskiner och arbetsbänkar.'
  where post_id = 'c0000000-0000-4000-8000-000000000010';
insert into public.memory_votes (post_id, user_id) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003')
on conflict do nothing;
