-- Uppdatering: grupper får plats (land, region, stad), inlägg får typ (vanlig/finansiering/lokal),
-- lokaler får funktion och kostnad, och kategorierna blir ämnen man kan tagga vanliga inlägg med.

alter table public.groups add column if not exists country text;
alter table public.groups add column if not exists region text;
alter table public.groups add column if not exists city text;

alter table public.posts add column if not exists kind text not null default 'vanlig';
alter table public.posts drop constraint if exists posts_kind_check;
alter table public.posts add constraint posts_kind_check check (kind in ('vanlig', 'finansiering', 'lokal'));
alter table public.posts add column if not exists space_functions text[] not null default '{}';
alter table public.posts add column if not exists space_cost text;
alter table public.posts drop constraint if exists posts_space_cost_check;
alter table public.posts add constraint posts_space_cost_check check (space_cost in ('gratis', 'gentjanst', 'kostar'));
alter table public.posts add column if not exists space_price text;

-- Befintliga inlägg får rätt typ
update public.posts set kind = 'finansiering' where fin_total is not null;
update public.posts set kind = 'lokal', space_cost = coalesce(space_cost, 'gratis')
  where fin_total is null and 'Lokaler' = any(categories);
update public.posts set categories = array_remove(array_remove(categories, 'Lokaler'), 'Finansiering');
delete from public.categories where name in ('Lokaler', 'Finansiering');
insert into public.categories (name) values ('Energi'), ('Byggmetod'), ('Off-grid'), ('Vatten'), ('Avfall'), ('Mat'), ('Ekonomi')
  on conflict (name) do nothing;

-- Exempeldata: plats för exempelgrupperna
update public.groups set country = 'Sverige', region = 'Uppsala län', city = 'Uppsala' where id in ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000005');
update public.groups set country = 'Sverige', region = 'Stockholms län', city = 'Stockholm' where id = 'b0000000-0000-4000-8000-000000000002';
update public.groups set country = 'Sverige', region = 'Västra Götalands län', city = 'Göteborg' where id = 'b0000000-0000-4000-8000-000000000003';
update public.groups set country = 'Sverige', region = 'Skåne län', city = 'Malmö' where id = 'b0000000-0000-4000-8000-000000000004';

-- Exempeldata: lokaler och ämnen
update public.posts set space_functions = '{Verkstad}', space_cost = 'gratis' where id = 'c0000000-0000-4000-8000-000000000003';
update public.posts set space_functions = '{Förråd,"Kyl och frys"}', space_cost = 'gentjanst' where id = 'c0000000-0000-4000-8000-000000000010';
update public.posts set categories = '{Vatten,Byggmetod}' where id = 'c0000000-0000-4000-8000-000000000001';
update public.posts set categories = '{Avfall,Mat}' where id = 'c0000000-0000-4000-8000-000000000004';
update public.posts set categories = '{Byggmetod}' where id = 'c0000000-0000-4000-8000-000000000005';
update public.posts set categories = '{Energi}' where id = 'c0000000-0000-4000-8000-000000000008';
update public.posts set is_resource = (kind <> 'vanlig' or cardinality(categories) > 0);
