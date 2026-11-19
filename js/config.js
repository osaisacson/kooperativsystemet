// Appens namn – byt fritt.
export const APP_NAME = 'Kooperativsystemet';

// Fyll i från Supabase → Project Settings → API ("Project URL" och "anon public"-nyckeln).
// Lämnas de tomma körs appen i demoläge: all data sparas bara i den här webbläsaren.
// Anon-nyckeln är gjord för att ligga i webbläsaren; behörigheter styrs av reglerna i supabase/setup.sql.
export const SUPABASE_URL = 'https://fzpicyaiosdrfjodsnmd.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6cGljeWFpb3NkcmZqb2Rzbm1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwODM2OTcsImV4cCI6MjExMDY1OTY5N30.xs9OT4VI8xL1I8gXs905LseK0OeGNcB8GMAULTEbWHY';

// Inloggning via andra konton. Varje leverantör måste också slås på i Supabase → Authentication → Sign In / Providers.
// Möjliga värden: 'google', 'apple'.
export const AUTH_PROVIDERS = ['google'];

// Publik nyckel för push-notiser (den privata ligger bara i databasens app_settings, aldrig i koden).
export const VAPID_PUBLIC_KEY = 'BOFoj6zvGNLT7pK3VM1NZyLTdZwqi_UIogLfv_pma8XtjDfkisH0FuvByhR4AvVL7Vz1xZkJPWqg2c-OfsbqGnU';
