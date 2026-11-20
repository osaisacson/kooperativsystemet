-- 013: Svar på kommentarer i feedbacken (trådar som på Reddit) och statusarna Förslag / Planerad / Klar.
alter table public.feedback_comments add column if not exists parent_id uuid references public.feedback_comments(id) on delete cascade;
update public.feedback set status = null where status = 'inte nu';
alter table public.feedback drop constraint if exists feedback_status_check;
alter table public.feedback add constraint feedback_status_check check (status in ('planerad', 'klar'));
-- Beskrivningen krävs
update public.feedback set body = title where trim(body) = '';
alter table public.feedback drop constraint if exists feedback_body_check;
alter table public.feedback add constraint feedback_body_check check (length(trim(body)) between 1 and 4000);
select 'klart' as resultat;
