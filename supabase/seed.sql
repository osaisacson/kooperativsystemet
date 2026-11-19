-- Exempeldata. Skapad av tools/build-seed-sql.mjs – ändra i js/seed.js och kör skriptet igen.
-- Exempelanvändarna har inga inloggningar; skapa egna konton i appen för att testa.

insert into public.categories (name) values
  ('Energi'),
  ('Byggmetod'),
  ('Off-grid'),
  ('Vatten'),
  ('Avfall'),
  ('Mat'),
  ('Ekonomi') on conflict (name) do nothing;
insert into public.profiles (id, name, created_at, last_seen_at) values
  ('a0000000-0000-4000-8000-000000000001', 'Maja Ek', now() - interval '5000 hours', now() - interval '1 hours'),
  ('a0000000-0000-4000-8000-000000000002', 'Johan Berg', now() - interval '4800 hours', now() - interval '3 hours'),
  ('a0000000-0000-4000-8000-000000000003', 'Leila Haddad', now() - interval '4500 hours', now() - interval '2 hours'),
  ('a0000000-0000-4000-8000-000000000004', 'Oskar Nilsson', now() - interval '4200 hours', now() - interval '6 hours'),
  ('a0000000-0000-4000-8000-000000000005', 'Sara Wiklund', now() - interval '4100 hours', now() - interval '10 hours'),
  ('a0000000-0000-4000-8000-000000000006', 'Amir Karimi', now() - interval '3900 hours', now() - interval '4 hours');
insert into public.groups (id, name, description, avatar_url, country, region, city, address, lat, lng, created_at, last_activity_at) values
  ('b0000000-0000-4000-8000-000000000001', 'Gråvattengruppen Gottsunda', 'Fem hushåll som renar sitt bad- och diskvatten i en vassbädd i stället för att skicka det till reningsverket. Vi dokumenterar allt så att andra kan bygga likadant.', 'https://images.unsplash.com/photo-1525542419642-fb8c7259a04c?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Uppsala län', 'Uppsala', 'Gottsunda, Uppsala', 59.8095, 17.623, now() - interval '2000 hours', now() - interval '3 hours'),
  ('b0000000-0000-4000-8000-000000000002', 'Solkollektivet Hägersten', 'Grannar som äger solpaneler tillsammans och delar på elen. Just nu: 24 paneler på garagetaket.', 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Stockholms län', 'Stockholm', 'Hägersten, Stockholm', 59.296, 17.979, now() - interval '3000 hours', now() - interval '4 hours'),
  ('b0000000-0000-4000-8000-000000000003', 'Kompost & kretslopp Väster', 'Bokashi i trapphusen, maskkompost i källaren och jord tillbaka till odlingslådorna.', 'https://images.unsplash.com/photo-1716903282677-3a1b5c936b41?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Västra Götalands län', 'Göteborg', 'Majorna, Göteborg', 57.6905, 11.916, now() - interval '2500 hours', now() - interval '9 hours'),
  ('b0000000-0000-4000-8000-000000000004', 'Bytesringen Sofielund', 'Vi byter tid, verktyg och tjänster utan pengar. En timme är en timme, oavsett vad man gör.', 'https://images.unsplash.com/photo-1499744349893-0c6de53516e6?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Skåne län', 'Malmö', 'Sofielund, Malmö', 55.592, 13.012, now() - interval '4000 hours', now() - interval '7 hours'),
  ('b0000000-0000-4000-8000-000000000005', 'Lerhusbyggarna', 'Vi lär oss bygga med lera, halm och kalk – material som finns nära och går att återbruka.', 'https://images.unsplash.com/photo-1467842976472-03f46c6b1e3d?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Uppsala län', 'Uppsala', 'Luthagen, Uppsala', 59.864, 17.627, now() - interval '1800 hours', now() - interval '45 hours'),
  ('b0000000-0000-4000-8000-000000000006', 'Andelsodlingen Hisingen', 'Tjugo hushåll som delar på en odling, ett växthus och skörden. Alla jobbar några timmar i veckan.', 'https://images.unsplash.com/photo-1781785273371-a959f34bfab0?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Västra Götalands län', 'Göteborg', 'Backa, Hisingen, Göteborg', 57.747, 11.971, now() - interval '1400 hours', now() - interval '12 hours'),
  ('b0000000-0000-4000-8000-000000000007', 'Energigemenskapen Kungsladugård', 'Tre bostadsrättsföreningar som delar solel, ett batteri och en elbilspool.', 'https://images.unsplash.com/photo-1694327671725-e2a81cda3436?w=400&h=400&fit=crop&q=80&auto=format', 'Sverige', 'Västra Götalands län', 'Göteborg', 'Kungsladugård, Göteborg', 57.685, 11.902, now() - interval '1100 hours', now() - interval '7 hours');
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000001' where id = 'b0000000-0000-4000-8000-000000000001';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000004' where id = 'b0000000-0000-4000-8000-000000000002';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000003' where id = 'b0000000-0000-4000-8000-000000000003';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000005' where id = 'b0000000-0000-4000-8000-000000000004';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000006' where id = 'b0000000-0000-4000-8000-000000000005';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000003' where id = 'b0000000-0000-4000-8000-000000000006';
update public.groups set created_by = 'a0000000-0000-4000-8000-000000000006' where id = 'b0000000-0000-4000-8000-000000000007';
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
  ('b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000004', 'member', now() - interval '500 hours'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000003', 'admin', now() - interval '1400 hours'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'member', now() - interval '900 hours'),
  ('b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000006', 'member', now() - interval '300 hours'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000006', 'admin', now() - interval '1100 hours'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000005', 'member', now() - interval '700 hours'),
  ('b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000002', 'member', now() - interval '200 hours');
insert into public.posts (id, author_id, group_id, caption, kind, is_resource, categories, space_functions, space_cost, space_price, fin_total, fin_mode, fin_expires_at, created_at, updated_at, last_activity_at) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Så byggde vi vår vassbädd för gråvatten – hela processen i tre bilder. Kostnad: ca 9 000 kr för fem hushåll. Fråga gärna!', 'vanlig', true, array['Vatten', 'Byggmetod']::text[], '{}'::text[], null, null, null, null, null, now() - interval '5 hours', now() - interval '5 hours', now() - interval '3 hours'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'Vi har fått 40 000 kr från kvarterets gemensamma kassa att dela ut till hushåll som vill testa egen solel eller batterilagring. Sök hur mycket du behöver och berätta kort vad du vill göra – vi beslutar löpande.', 'finansiering', true, '{}'::text[], '{}'::text[], null, null, 40000, 'split', now() + interval '21 days', now() - interval '30 hours', now() - interval '30 hours', now() - interval '4 hours'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000004', 'Verkstadslokalen på Sofielundsvägen 12 är ledig tisdagar och torsdagar kl 17–21. Pelarborr, hyvelbänk och svets finns. Gratis för alla grupper här – skriv till mig så får du koden.', 'lokal', true, '{}'::text[], array['Verkstad']::text[], 'gratis', null, null, null, null, now() - interval '10 hours', now() - interval '10 hours', now() - interval '9 hours'),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 'Första skörden av maskkompost från källaren! 40 liter svart guld till odlingslådorna på gården.', 'vanlig', true, array['Avfall', 'Mat']::text[], '{}'::text[], null, null, null, null, null, now() - interval '20 hours', now() - interval '20 hours', now() - interval '18 hours'),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005', 'Vårt recept på lerputs som håller utomhus: 1 del lera, 3 delar sand, en näve hackad halm. Slutputsa med kalk.', 'vanlig', true, array['Byggmetod']::text[], '{}'::text[], null, null, null, null, null, now() - interval '50 hours', now() - interval '50 hours', now() - interval '45 hours'),
  ('c0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Grävdag på lördag kl 10 – vi förlänger vassbädden så att hus nummer sex kan kopplas på. Fika finns!', 'vanlig', false, '{}'::text[], '{}'::text[], null, null, null, null, null, now() - interval '3 hours', now() - interval '3 hours', now() - interval '3 hours'),
  ('c0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003', '5 000 kr till en grupp som vill starta bokashi i sitt trapphus. Pengarna räcker till hinkar, strö och en introduktionskväll. Ansök som kommentar!', 'finansiering', true, '{}'::text[], '{}'::text[], null, null, 5000, 'single', now() + interval '12 days', now() - interval '26 hours', now() - interval '26 hours', now() - interval '9 hours'),
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'Panelerna är uppe! Tack alla som bar, skruvade och fixade fika.', 'vanlig', true, array['Energi']::text[], '{}'::text[], null, null, null, null, null, now() - interval '70 hours', now() - interval '70 hours', now() - interval '70 hours'),
  ('c0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000004', 'Någon som har en lång stege att låna ut i helgen? Ska rensa hängrännor.', 'vanlig', false, '{}'::text[], '{}'::text[], null, null, null, null, null, now() - interval '8 hours', now() - interval '8 hours', now() - interval '7 hours'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000003', 'Tips för alla i Göteborg: Mikrofabriken är en delad verkstad där man kan använda maskiner och verktyg man inte har själv. Bra ställe att bygga prototyper eller laga saker tillsammans. Kolla deras hemsida för öppettider och vad det kostar.', 'lokal', true, '{}'::text[], array['Verkstad', 'Ateljé']::text[], 'kostar', 'Se deras hemsida', null, null, null, now() - interval '40 hours', now() - interval '40 hours', now() - interval '40 hours'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000006', 'Första säsongen är slut: 1,2 ton grönsaker på 20 hushåll. Varje hushåll betalade 1 500 kr och jobbade tre timmar i veckan. Vi delar gärna vår budget och vårt schema.', 'vanlig', true, array['Mat', 'Ekonomi']::text[], '{}'::text[], null, null, null, null, null, now() - interval '14 hours', now() - interval '14 hours', now() - interval '12 hours'),
  ('c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000006', 'Vi har 15 000 kr över från ett kommunalt bidrag att dela ut till grupper som vill starta en odling på en gård eller i en park. Sök till frön, jord, verktyg eller pallkragar.', 'finansiering', true, '{}'::text[], '{}'::text[], null, null, 15000, 'split', now() + interval '30 days', now() - interval '22 hours', now() - interval '22 hours', now() - interval '20 hours'),
  ('c0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000007', 'Vår föreningslokal med kök går att låna kvällar och helger. I gengäld hjälper man till med en städdag per år.', 'lokal', true, '{}'::text[], array['Möteslokal', 'Kök']::text[], 'gentjanst', null, null, null, null, now() - interval '7 hours', now() - interval '7 hours', now() - interval '7 hours'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000007', 'Batteriet i källaren har gjort att vi klarat oss utan köpt el 41 dagar i år. Här är hur vi styr när bilarna laddar så att solelen räcker.', 'vanlig', true, array['Energi', 'Off-grid']::text[], '{}'::text[], null, null, null, null, null, now() - interval '30 hours', now() - interval '30 hours', now() - interval '27 hours'),
  ('c0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002', 'Snickeriet i garaget går att hyra kvällstid. Bandsåg, rikt- och planhyvel finns. Ta med egna sågblad.', 'lokal', true, '{}'::text[], array['Verkstad']::text[], 'kostar', '100 kr per kväll', null, null, null, now() - interval '18 hours', now() - interval '18 hours', now() - interval '18 hours'),
  ('c0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', '8 000 kr till en grupp som vill bygga sin första vassbädd eller sitt första gråvattenfilter. Vi kommer gärna och hjälper till en dag också.', 'finansiering', true, '{}'::text[], '{}'::text[], null, null, 8000, 'single', now() + interval '18 days', now() - interval '36 hours', now() - interval '36 hours', now() - interval '36 hours'),
  ('c0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000004', 'Bytesringen har nu bytt 340 timmar i år: barnpassning, cykellagning, skjuts och snickeri. Vi använder ett enkelt delat kalkylark – vill ni ha mallen?', 'vanlig', true, array['Ekonomi']::text[], '{}'::text[], null, null, null, null, null, now() - interval '26 hours', now() - interval '26 hours', now() - interval '26 hours'),
  ('c0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000005', 'Växthuset bakom lerhuset står tomt på vintern. Låna det för förodling eller som förråd för material.', 'lokal', true, '{}'::text[], array['Odling', 'Förråd']::text[], 'gratis', null, null, null, null, now() - interval '60 hours', now() - interval '60 hours', now() - interval '60 hours');
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
  ('f0000010-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000010', 0, 'https://images.unsplash.com/photo-1759523146335-0069847ceb16?w=1080&h=1080&fit=crop&q=80&auto=format', 'Delade maskiner och arbetsbänkar.'),
  ('f0000011-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000011', 0, 'https://images.unsplash.com/photo-1781785273371-a959f34bfab0?w=1080&h=1080&fit=crop&q=80&auto=format', 'Skördefest i oktober.'),
  ('f0000011-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000011', 1, 'https://images.unsplash.com/photo-1763844599737-be3850c60cea?w=1080&h=1080&fit=crop&q=80&auto=format', 'Sådd i april – alla hjälps åt.'),
  ('f0000012-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000012', 0, 'https://images.unsplash.com/photo-1611843467160-25afb8df1074?w=1080&h=1080&fit=crop&q=80&auto=format', 'Pengar till frön, jord och pallkragar.'),
  ('f0000013-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000013', 0, 'https://images.unsplash.com/photo-1781785161788-a906202dba8f?w=1080&h=1080&fit=crop&q=80&auto=format', 'Plats för ungefär 30 personer.'),
  ('f0000014-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000014', 0, 'https://images.unsplash.com/photo-1726221062287-fda475b85493?w=1080&h=1080&fit=crop&q=80&auto=format', 'Växelriktare och batteri, 30 kWh.'),
  ('f0000015-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000015', 0, 'https://images.unsplash.com/photo-1547609434-b732edfee020?w=1080&h=1080&fit=crop&q=80&auto=format', 'Snickeriet i garaget.'),
  ('f0000016-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000016', 0, 'https://images.unsplash.com/photo-1651197227940-60c9d32f89e7?w=1080&h=1080&fit=crop&q=80&auto=format', 'Fördelningsrör till en ny bädd.'),
  ('f0000017-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000017', 0, 'https://images.unsplash.com/photo-1599651971621-7c42aaa20cd2?w=1080&h=1080&fit=crop&q=80&auto=format', 'Verktygen som lånas ut mest.'),
  ('f0000018-0000-4000-8000-000000000000', 'c0000000-0000-4000-8000-000000000018', 0, 'https://images.unsplash.com/photo-1781785178874-7e4a5ece4348?w=1080&h=1080&fit=crop&q=80&auto=format', 'Växthuset, 40 kvadratmeter.');
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
  ('d0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003', null, 'd0000000-0000-4000-8000-000000000002', 'Smart. Hur stor är tanken?', now() - interval '3 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001', null, null, 'Ja tack, budgeten skulle vi gärna se!', now() - interval '12 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000004', null, 'Vi vill bygga tolv pallkragar på gården bakom Sofielundsvägen och starta en odlingsgrupp.', now() - interval '20 hours', 4000, 'applied', null, null),
  ('d0000000-0000-4000-8000-000000000016', 'c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004', null, null, 'Vilken styrning använder ni för laddningen?', now() - interval '28 hours', null, null, null, null),
  ('d0000000-0000-4000-8000-000000000017', 'c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000005', null, 'd0000000-0000-4000-8000-000000000016', 'Ett enkelt skript på en Raspberry Pi som läser elpriset och batterinivån. Delar gärna!', now() - interval '27 hours', null, null, null, null);
insert into public.payouts (comment_id, details) values
  ('d0000000-0000-4000-8000-000000000003', 'Bankkonto: 8327-9, 123 456 789-0'),
  ('d0000000-0000-4000-8000-000000000004', 'Swish: 070-123 45 67'),
  ('d0000000-0000-4000-8000-000000000006', 'Swish: 070-123 45 67'),
  ('d0000000-0000-4000-8000-000000000015', 'Swish: 070-000 00 01');
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
update public.posts set last_activity_at = now() - interval '12 hours' where id = 'c0000000-0000-4000-8000-000000000011';
update public.posts set last_activity_at = now() - interval '20 hours' where id = 'c0000000-0000-4000-8000-000000000012';
update public.posts set last_activity_at = now() - interval '7 hours' where id = 'c0000000-0000-4000-8000-000000000013';
update public.posts set last_activity_at = now() - interval '27 hours' where id = 'c0000000-0000-4000-8000-000000000014';
update public.posts set last_activity_at = now() - interval '18 hours' where id = 'c0000000-0000-4000-8000-000000000015';
update public.posts set last_activity_at = now() - interval '36 hours' where id = 'c0000000-0000-4000-8000-000000000016';
update public.posts set last_activity_at = now() - interval '26 hours' where id = 'c0000000-0000-4000-8000-000000000017';
update public.posts set last_activity_at = now() - interval '60 hours' where id = 'c0000000-0000-4000-8000-000000000018';
update public.groups set last_activity_at = now() - interval '3 hours' where id = 'b0000000-0000-4000-8000-000000000001';
update public.groups set last_activity_at = now() - interval '4 hours' where id = 'b0000000-0000-4000-8000-000000000002';
update public.groups set last_activity_at = now() - interval '9 hours' where id = 'b0000000-0000-4000-8000-000000000003';
update public.groups set last_activity_at = now() - interval '7 hours' where id = 'b0000000-0000-4000-8000-000000000004';
update public.groups set last_activity_at = now() - interval '45 hours' where id = 'b0000000-0000-4000-8000-000000000005';
update public.groups set last_activity_at = now() - interval '12 hours' where id = 'b0000000-0000-4000-8000-000000000006';
update public.groups set last_activity_at = now() - interval '7 hours' where id = 'b0000000-0000-4000-8000-000000000007';
delete from public.notifications where post_id in ('c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000016', 'c0000000-0000-4000-8000-000000000017', 'c0000000-0000-4000-8000-000000000018');
insert into public.highlights (id, group_id, title, post_ids, created_at) values
  ('e0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Vassbädden', array['c0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006']::uuid[], now() - interval '2 hours'),
  ('e0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Bidrag', array['c0000000-0000-4000-8000-000000000002']::uuid[], now() - interval '29 hours'),
  ('e0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000002', 'Bygget', array['c0000000-0000-4000-8000-000000000008']::uuid[], now() - interval '60 hours'),
  ('e0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000005', 'Recept', array['c0000000-0000-4000-8000-000000000005']::uuid[], now() - interval '49 hours');
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
  ('c0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000003'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000004'),
  ('c0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002'),
  ('c0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000006'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000001'),
  ('c0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000003');
