-- 015: Bildkällor ("Bild från: …", "Från: …") och "KONTAKTPERSON …" bort ur beskrivningarna som hämtades från byggemenskaper.se.
-- Kontaktraderna innehöll andra personers namn, mejl och telefonnummer.
update public.groups set description = $t$Senast i juni beräknas det nya utegymmet stå klart och i slutet av maj börjar monteringen av den nya multiarenan på gräsytan nedanför klubbhuset, på västsidan av den lilla …$t$ where id = '4bd8037d-1d92-48b3-898d-cb42fbb04d85';
update public.groups set description = $t$Vid en processdag i Blomstermåla 2015 gick startskottet för att utveckla Timmernabben motorsportklubb. Styrelse och ledare var med och satte upp delmål och visioner för föreningen.$t$ where id = '67b579bb-f45f-4f84-8e44-80d49190379c';
update public.groups set description = $t$Mötesplats Stöcke startade som ett unikt gräsrotsinitiativ och är nu en 2,500 kvadratmeter toppmodern aktivitetsanläggning i Stöcke, Västerbotten.$t$ where id = '7f8735b9-b8f0-4f09-8a77-99d274688f99';
update public.groups set description = $t$$t$ where id = '29acb839-5076-4615-a977-90193606288a';
update public.groups set description = $t$Sedan lång tid tillbaka hade pensionärsföreningarna i Färjestaden påtalat behovet av ett seniorboende i Mörbylånga kommun. Det stod dock snart klart att det inte skulle komma att byggas något seniorboende i kommunal regi.$t$ where id = 'c0554956-b461-447c-8617-5ad4508d81ad';
update public.groups set description = $t$I Björsbyn utanför Luleå ligger en ekoby. 18 villor med urinseparering, slam-avskiljning och infiltration i gemensam va-anläggning.$t$ where id = 'ac271fe5-cdc2-4cb6-9032-cb6b1e0587f6';
update public.groups set description = $t$Konvalescenthem från 1936, ombyggt 1998 av oss boende i samarbete med HSB 8 km söder om Stockholms centrum. Gebers bygger på tron att det går att skapa boendeformer som bygger på samarbete och ekologi.$t$ where id = '37e0fe2e-412a-46ae-b932-fdbca70eae7c';
update public.groups set description = $t$Tulpanen blev Cypressen när äldreboendet i Hammenhög döptes om och fick nytt innehåll.$t$ where id = '03d4e431-378c-4628-9633-d0d3e4f16723';
update public.groups set description = btrim(regexp_replace(description, '\s*KONTAKTPERSON.*$', '')) where description ~ 'KONTAKTPERSON';
select count(*) filter (where description ~* '(Bild från|^Från):|KONTAKTPERSON|Upplagd av') as kvar from public.groups;
