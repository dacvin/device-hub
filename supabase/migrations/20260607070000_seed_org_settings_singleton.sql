-- Idempotent seed of the org_settings singleton.
-- The schema's INSERT in 09_settings.sql only runs against the declarative
-- schema files; `supabase db diff` skips data inserts. Production migrations
-- and `supabase db push` therefore leave the table empty, which breaks every
-- page that reads it (Overview, Device list, Settings).
INSERT INTO public.org_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
