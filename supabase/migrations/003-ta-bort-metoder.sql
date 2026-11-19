-- Kategorin "Metoder" tas bort. Inlägg som hade den ligger kvar som gemensamma resurser utan kategori.
update public.posts set categories = array_remove(categories, 'Metoder') where 'Metoder' = any(categories);
delete from public.categories where name = 'Metoder';
-- Exempelinlägget utan grupp flyttas till Bytesringen Sofielund, så att gruppens admins kan ta bort det.
update public.posts set group_id = 'b0000000-0000-4000-8000-000000000004'
  where id = 'c0000000-0000-4000-8000-000000000009' and group_id is null;
