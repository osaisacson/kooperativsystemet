-- Uppdatering: prenumerationslänk för kalendern och push-notiser (siffra på appikonen även när appen är stängd).
-- Nycklarna för push läggs in separat (se README), de ska inte ligga i koden.

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
