-- Uppdatering för databaser skapade före smeknamn och gruppers hemsida.
-- (Nya installationer behöver inte köra den här – setup.sql innehåller redan ändringarna.)
alter table public.profiles add column if not exists nickname text;
alter table public.groups add column if not exists homepage text;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, nickname)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), split_part(new.email, '@', 1)),
          nullif(trim(new.raw_user_meta_data->>'nickname'), ''));
  return new;
end $$;
