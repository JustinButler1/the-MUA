-- Auto-create profile when a new user signs up
-- This trigger ensures that every auth user has a corresponding profile

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

-- Drop trigger if it exists (for idempotent re-runs)
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger on auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

