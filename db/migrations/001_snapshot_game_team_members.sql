-- Snapshot current team membership into spades_game_team_members when a game row is created
-- Safe to run multiple times; trigger is recreated idempotently

create or replace function public.fn_snapshot_game_team_members()
returns trigger
language plpgsql
as $$
begin
  insert into public.spades_game_team_members (game_id, team_id, slot, user_id, guest_id)
  select new.id, tm.team_id, tm.slot, tm.user_id, tm.guest_id
  from public.team_members tm
  where tm.team_id in (new.team1_id, new.team2_id);
  return new;
end;
$$;

-- Avoid duplicate trigger definitions if re-applied
drop trigger if exists trg_snapshot_game_team_members on public.spades_games;

create trigger trg_snapshot_game_team_members
after insert on public.spades_games
for each row execute function public.fn_snapshot_game_team_members();


