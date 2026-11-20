-- 011: Var man håller till (land, region, stad, postnummer) och vilken nivå appen startar på.
-- Ligger i en egen tabell som bara ägaren kan läsa – andra ser aldrig ens plats.
create table if not exists public.home_places (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  country text, region text, city text,
  postcode text,                     -- stadsdelen räknas från de tre första siffrorna
  district text,                     -- stadsdelens namn (från OpenStreetMap), om det hittades
  level text not null default 'city' check (level in ('country', 'region', 'city', 'district')),
  updated_at timestamptz not null default now()
);
alter table public.home_places enable row level security;
drop policy if exists "egen plats" on public.home_places;
create policy "egen plats" on public.home_places for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Platsen som angavs vid registreringen följer med kontot och sparas när kontot skapas.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb); h jsonb := m->'home';
begin
  insert into profiles (id, name, nickname, avatar_url)
  values (
    new.id,
    coalesce(nullif(trim(m->>'name'), ''), nullif(trim(m->>'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(m->>'nickname'), ''),
    coalesce(nullif(m->>'avatar_url', ''), nullif(m->>'picture', ''))   -- profilbild från Google
  );
  if jsonb_typeof(h) = 'object' and nullif(trim(h->>'country'), '') is not null then
    insert into home_places (user_id, country, region, city, postcode, district, level)
    values (new.id, trim(h->>'country'), nullif(trim(h->>'region'), ''), nullif(trim(h->>'city'), ''),
      nullif(trim(h->>'postcode'), ''), nullif(h->>'district', ''),
      case when h->>'level' in ('country', 'region', 'city', 'district') then h->>'level' else 'city' end);
  end if;
  return new;
end $$;

-- Platser där det finns grupper, för förslagen när man skapar konto (innan man är inloggad).
-- Bara land, region och stad – inga namn eller andra uppgifter.
create or replace function public.group_places() returns table (country text, region text, city text)
language sql stable security definer set search_path = public as $$
  select country, region, city from groups where country is not null;
$$;
grant execute on function public.group_places() to anon, authenticated;

select 'klart' as status;
