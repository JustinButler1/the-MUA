-- Backfill snapshots and rebuild stats from outcomes

-- Ensure snapshots exist for all existing games
insert into public.spades_game_team_members (game_id, team_id, slot, user_id, guest_id)
select g.id, tm.team_id, tm.slot, tm.user_id, tm.guest_id
from public.spades_games g
join public.team_members tm on tm.team_id in (g.team1_id, g.team2_id)
where not exists (
  select 1 from public.spades_game_team_members s where s.game_id = g.id
);

-- Rebuild team & player stats from outcomes
truncate public.team_stats;
truncate public.player_stats_users;
truncate public.player_stats_guests;

-- Apply outcomes to stats for all existing outcomes
select public.apply_outcome(game_id) from public.spades_game_outcomes;


