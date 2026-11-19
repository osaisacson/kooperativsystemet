-- Nya konton via Google/Apple får namn och profilbild därifrån.
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
