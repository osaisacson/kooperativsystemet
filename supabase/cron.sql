-- Valfritt: kör admin-kontrollen varje natt kl 03.
-- Aktivera först tillägget pg_cron: Supabase → Database → Extensions → pg_cron.
select cron.schedule('admin-succession', '0 3 * * *', $$select public.admin_succession()$$);
