-- Exempeldata. Skapad av tools/build-seed-sql.mjs – ändra i js/seed.js och kör skriptet igen.
-- Exempelanvändarna har inga inloggningar; skapa egna konton i appen för att testa.

insert into public.profiles (id, name, created_at, last_seen_at) values
  ('a0000000-0000-4000-8000-000000000001', 'Maja Ek', now() - interval '5000 hours', now() - interval '1 hours'),
  ('a0000000-0000-4000-8000-000000000002', 'Johan Berg', now() - interval '4800 hours', now() - interval '3 hours'),
  ('a0000000-0000-4000-8000-000000000003', 'Leila Haddad', now() - interval '4500 hours', now() - interval '2 hours'),
  ('a0000000-0000-4000-8000-000000000004', 'Oskar Nilsson', now() - interval '4200 hours', now() - interval '6 hours'),
  ('a0000000-0000-4000-8000-000000000005', 'Sara Wiklund', now() - interval '4100 hours', now() - interval '10 hours'),
  ('a0000000-0000-4000-8000-000000000006', 'Amir Karimi', now() - interval '3900 hours', now() - interval '4 hours');
insert into public.groups (id, name, description, avatar_url, created_at, last_activity_at) values
  ('b0000000-0000-4000-8000-000000000001', 'Gråvattengruppen Gottsunda', 'Fem hushåll som renar sitt bad- och diskvatten i en vassbädd i stället för att skicka det till reningsverket. Vi dokumenterar allt så att andra kan bygga likadant.', 'https://images.unsplash.com/photo-1525542419642-fb8c7259a04c?w=400&h=400&fit=crop&q=80&auto=format', now() - interval '2000 hours', now() - interval '3 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'Solkollektivet Hägersten', 'Grannar som äger solpaneler tillsammans och delar på elen. Just nu: 24 paneler på garagetaket.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&h=400&fit=crop&q=80&auto=format', now() - interval '3000 hours', now() - interval '4 hours'),
  ('b0000000-0000-4000-8000-000000000003', 'Kompost & kretslopp Väster', 'Bokashi i trapphusen, maskkompost i källaren och jord tillbaka till odlingslådorna.', 'https://images.unsplash.com/photo-1716903282677-3a1b5c936b41?w=400&h=400&fit=crop&q=80&auto=format', now() - interval '2500 hours', now() - interval '9 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'Bytesringen Sofielund', 'Vi byter tid, verktyg och tjänster utan pengar. En timme är en timme, oavsett vad man gör.', 'https://images.unsplash.com/photo-1499744349893-0c6de53516e6?w=400&h=400&fit=crop&q=80&auto=format', now() - interval '4000 hours', now() - interval '7 hours'),
  ('b0000000-0000-4000-8000-000000000005', 'Lerhusbyggarna', 'Vi lär oss bygga med lera, halm och kalk – material som finns nära och går att återbruka.', 'https://images.unsplash.com/photo-1467842976472-03f46c6b1e3d?w=400&h=400&fit=crop&q=80&auto=format', now() - interval '1800 hours', now() - interval '45 hours');
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000001' where id = 'b0000000-0000-4000-8000-000000000001';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000004' where id = 'b0000000-0000-4000-8000-000000000002';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000003' where id = 'b0000000-0000-4000-8000-000000000003';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000005' where id = 'b0000000-0000-4000-8000-000000000004';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000006' where id = 'b0000000-0000-4000-8000-000000000005';
insert into public.group_members (group_id, user_id, role, joined_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'admin', now() - interval '2000 hours'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'member', now() - interval '1500 hours'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', 'member', now() - interval '1200 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'admin', now() - interval '3000 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'member', now() - interval '900 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'member', now() - interval '800 hours'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000003', 'admin', now() - interval '2500 hours'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', 'member', now() - interval '700 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000005', 'admin', now() - interval '4000 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'member', now() - interval '1000 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000006', 'member', now() - interval '900 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000004', 'member', now() - interval '600 hours'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000006', 'admin', now() - interval '1800 hours'),
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'member', now() - interval '500 hours');
insert into public.posts (id, author_id, group_id, caption, is_resource, categories, fin_total, fin_mode, fin_expires_at, created_at, updated_at, last_activity_at) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Så byggde vi vår vassbädd för gråvatten – hela processen i tre bilder. Kostnad: ca 9 000 kr för fem hushåll. Fråga gärna!', true, '{}'::text[], null, null, null, now() - interval '5 hours', now() - interval '5 hours', now() - interval '3 hours'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'Vi har fått 40 000 kr från kvarterets gemensamma kassa att dela ut till hushåll som vill testa egen solel eller batterilagring. Sök hur mycket du behöver och berätta kort vad du vill göra – vi beslutar löpande.', true, array['Finansiering']::text[], 40000, 'split', now() + interval '21 days', now() - interval '30 hours', now() - interval '30 hours', now() - interval '4 hours'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000004', 'Verkstadslokalen på Sofielundsvägen 12 är ledig tisdagar och torsdagar kl 17–21. Pelarborr, hyvelbänk och svets finns. Gratis för alla grupper här – skriv till mig så får du koden.', true, array['Lokaler']::text[], null, null, null, now() - interval '10 hours', now() - interval '10 hours', now() - interval '9 hours'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 'Första skörden av maskkompost från källaren! 40 liter svart guld till odlingslådorna på gården.', false, '{}'::text[], null, null, null, now() - interval '20 hours', now() - interval '20 hours', now() - interval '18 hours'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005', 'Vårt recept på lerputs som håller utomhus: 1 del lera, 3 delar sand, en näve hackad halm. Slutputsa med kalk.', true, '{}'::text[], null, null, null, now() - interval '50 hours', now() - interval '50 hours', now() - interval '45 hours'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Grävdag på lördag kl 10 – vi förlänger vassbädden så att hus nummer sex kan kopplas på. Fika finns!', false, '{}'::text[], null, null, null, now() - interval '3 hours', now() - interval '3 hours', now() - interval '3 hours'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003', '5 000 kr till en grupp som vill starta bokashi i sitt trapphus. Pengarna räcker till hinkar, strö och en introduktionskväll. Ansök som kommentar!', true, array['Finansiering']::text[], 5000, 'single', now() + interval '12 days', now() - interval '26 hours', now() - interval '26 hours', now() - interval '9 hours'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'Panelerna är uppe! Tack alla som bar, skruvade och fixade fika.', false, '{}'::text[], null, null, null, now() - interval '70 hours', now() - interval '70 hours', now() - interval '70 hours'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000004', 'Någon som har en lång stege att låna ut i helgen? Ska rensa hängrännor.', false, '{}'::text[], null, null, null, now() - interval '8 hours', now() - interval '8 hours', now() - interval '7 hours'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004', 'Vi har en frysbox i källaren på Lantmannagatan 8 som kan användas för gemensamma storinköp. Plats för ungefär tio familjers ransoner.', true, array['Lokaler']::text[], null, null, null, now() - interval '40 hours', now() - interval '40 hours', now() - interval '40 hours');
insert into public.post_slides (id, post_id, position, image_url, text) values
  ('f0000001-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000001', 0, 'https://images.unsplash.com/photo-1592483335937-a3213ac4a833?w=1080&h=1080&fit=crop&q=80&auto=format', '1. Vi grävde en bädd på 2 × 6 meter, 80 cm djup, och lade i en tät duk.'),
  ('f0000001-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 1, 'https://images.unsplash.com/photo-1632199670702-3ea3f70909cb?w=1080&h=1080&fit=crop&q=80&auto=format', '2. Tvättad singel i botten, sand ovanpå. Fördelningsrör längs ena kortsidan.'),
  ('f0000001-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 2, 'https://images.unsplash.com/photo-1600772066490-18c330d042c8?w=1080&h=1080&fit=crop&q=80&auto=format', '3. Planterade bladvass. Efter en säsong renar den allt bad- och diskvatten från fem hushåll.'),
  ('f0000002-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000002', 0, 'https://images.unsplash.com/photo-1655300256335-beef51a914fe?w=1080&h=1080&fit=crop&q=80&auto=format', 'Paneler på ett av husen i kvarteret – nu vill vi hjälpa fler att komma igång.'),
  ('f0000003-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000003', 0, 'https://images.unsplash.com/photo-1788296817269-8df0458ab799?w=1080&h=1080&fit=crop&q=80&auto=format', 'Hyvelbänken och väggen med handverktyg.'),
  ('f0000004-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000004', 0, 'https://images.unsplash.com/photo-1492496913980-501348b61469?w=1080&h=1080&fit=crop&q=80&auto=format', 'Maskarna har jobbat sedan i mars.'),
  ('f0000005-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000005', 0, 'https://images.unsplash.com/photo-1675134768072-d700f38ceef0?w=1080&h=1080&fit=crop&q=80&auto=format', 'Blandning i baljor – testa alltid en provyta först.'),
  ('f0000005-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 1, 'https://images.unsplash.com/photo-1559173525-d16dfd7c17fe?w=1080&h=1080&fit=crop&q=80&auto=format', 'Första lagret på halmbalsväggen, ca 2 cm.'),
  ('f0000006-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000006', 0, 'https://images.unsplash.com/photo-1715274036728-4385d95a5e9f?w=1080&h=1080&fit=crop&q=80&auto=format', 'Spadar och skottkärror står redo.'),
  ('f0000007-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000007', 0, 'https://images.unsplash.com/photo-1605522283494-4901a98d458e?w=1080&h=1080&fit=crop&q=80&auto=format', 'En veckas matrester från trapphuset – i bokashin blir de jord på några veckor.'),
  ('f0000008-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000008', 0, 'https://images.unsplash.com/photo-1660330589243-4c640d878052?w=1080&h=1080&fit=crop&q=80&auto=format', '24 paneler, 9,6 kW.'),
  ('f0000010-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000010', 0, 'https://images.unsplash.com/photo-1606859191214-25806e8e2423?w=1080&h=1080&fit=crop&q=80&auto=format', 'Plats för storinköp, sorterat per familj.');
insert into public.comments (id, post_id, author_id, group_id, parent_id, body, created_at, applied_amount, status, decided_at, paid_at) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', null, null, 'Så fint! Hur gör ni på vintern när det fryser?', now() - interval '4 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', null, null, 'Vi leder vattnet till en sluten tank från december till mars. Skriver ett eget inlägg om det snart!', now() - interval '3.5 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000004', null, 'Vi vill sätta upp fyra paneler på förrådstaket i vår bostadsrättsförening och testa ett litet batteri.', now() - interval '28 hours', 8000, 'paid', now() - interval '27 hours', now() - interval '26 hours'),
  ('d0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', null, 'Jag vill köpa en mikroväxelriktare och två begagnade paneler till balkongen och dokumentera hur mycket de ger.', now() - interval '12 hours', 3000, 'applied', null, null),
  ('d0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', null, null, 'Går det att söka för en gemensam laddbox också?', now() - interval '6 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', null, 'Vi är tolv hushåll på Gottsundagatan som vill börja med bokashi. Vi har redan en plats i cykelrummet.', now() - interval '9 hours', 5000, 'applied', null, null),
  ('d0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000006', null, null, 'Kan man få lite? Våra pallkragar behöver det 😊', now() - interval '18 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', null, null, 'Vi testade receptet på vårt uthus – höll hela vintern!', now() - interval '45 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000002', null, null, 'Jag har en på 6 meter, hämta när du vill!', now() - interval '7 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000006', null, null, 'Perfekt, behöver svetsa ihop en kompostram. Hör av mig!', now() - interval '9 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', null, 'd0000000-0000-4000-8000-000000000005', 'Ja, om flera hushåll delar på den. Sök som grupp och berätta hur många som ska använda den.', now() - interval '5 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', null, 'd0000000-0000-4000-8000-000000000011', 'Toppen! Vi är fyra hushåll i Gottsunda – vi skriver ihop en ansökan i helgen.', now() - interval '4 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', null, 'd0000000-0000-4000-8000-000000000002', 'Smart. Hur stor är tanken?', now() - interval '3 hours', null, null, null, null);
insert into public.payouts (comment_id, details) values
  ('d0000000-0000-4000-8000-000000000003', 'Bankkonto: 8327-9, 123 456 789-0'),
  ('d0000000-0000-4000-8000-000000000004', 'Swish: 070-123 45 67'),
  ('d0000000-0000-4000-8000-000000000006', 'Swish: 070-123 45 67');
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
update public.groups set last_activity_at = now() - interval '3 hours' where id = 'b0000000-0000-4000-8000-000000000001';
update public.groups set last_activity_at = now() - interval '4 hours' where id = 'b0000000-0000-4000-8000-000000000002';
update public.groups set last_activity_at = now() - interval '9 hours' where id = 'b0000000-0000-4000-8000-000000000003';
update public.groups set last_activity_at = now() - interval '7 hours' where id = 'b0000000-0000-4000-8000-000000000004';
update public.groups set last_activity_at = now() - interval '45 hours' where id = 'b0000000-0000-4000-8000-000000000005';
delete from public.notifications where post_id in ('c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010');
insert into public.highlights (id, group_id, title, post_ids, created_at) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Vassbädden', array['c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006']::uuid[], now() - interval '2 hours'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Bidrag', array['c0000000-0000-4000-8000-000000000002']::uuid[], now() - interval '29 hours'),
  ('e0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 'Bygget', array['c0000000-0000-4000-8000-000000000008']::uuid[], now() - interval '60 hours'),
  ('e0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000005', 'Recept', array['c0000000-0000-4000-8000-000000000005']::uuid[], now() - interval '49 hours');
