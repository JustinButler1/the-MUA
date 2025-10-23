-- Backfill profiles for existing auth users who don't have a profile yet
-- Safe to run multiple times - only creates missing profiles

insert into public.profiles (user_id, display_name, created_at)
select 
  au.id,
  coalesce(au.raw_user_meta_data->>'display_name', split_part(au.email, '@', 1)) as display_name,
  au.created_at
from auth.users au
where not exists (
  select 1 from public.profiles p where p.user_id = au.id
);

