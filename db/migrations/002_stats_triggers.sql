-- Persisted stats: helper + trigger to apply outcomes to team and player stats

create or replace function public.apply_outcome(p_game_id uuid)
returns void
language plpgsql
as $$
declare
  o record;
  is_tie boolean;
  winner uuid;
begin
  select * into o from public.spades_game_outcomes where game_id = p_game_id;
  if not found then
    raise exception 'Outcome not found for game_id=%', p_game_id;
  end if;

  is_tie := (o.team1_total = o.team2_total);
  winner := o.winner_team_id; -- may be null for tie

  insert into public.team_stats as ts (team_id, games, wins, losses, ties, points_for, points_against, last_game_at)
  values
    (o.team1_id, 1,
       case when is_tie then 0 when winner = o.team1_id then 1 else 0 end,
       case when is_tie then 0 when winner = o.team1_id then 0 else 1 end,
       case when is_tie then 1 else 0 end,
       o.team1_total, o.team2_total, o.completed_at),
    (o.team2_id, 1,
       case when is_tie then 0 when winner = o.team2_id then 1 else 0 end,
       case when is_tie then 0 when winner = o.team2_id then 0 else 1 end,
       case when is_tie then 1 else 0 end,
       o.team2_total, o.team1_total, o.completed_at)
  on conflict (team_id) do update set
    games = ts.games + excluded.games,
    wins = ts.wins + excluded.wins,
    losses = ts.losses + excluded.losses,
    ties = ts.ties + excluded.ties,
    points_for = ts.points_for + excluded.points_for,
    points_against = ts.points_against + excluded.points_against,
    last_game_at = greatest(ts.last_game_at, excluded.last_game_at);

  with participants as (
    select sgtm.*,
           (case when winner is null then 'tie'
                 when sgtm.team_id = winner then 'win' else 'loss' end) as result
    from public.spades_game_team_members sgtm
    where sgtm.game_id = p_game_id
  )
  insert into public.player_stats_users as ps (user_id, games, wins, losses, ties, last_game_at)
  select p.user_id, 1,
         sum((p.result = 'win')::int),
         sum((p.result = 'loss')::int),
         sum((p.result = 'tie')::int),
         o.completed_at
  from participants p
  where p.user_id is not null
  group by p.user_id
  on conflict (user_id) do update set
    games = ps.games + excluded.games,
    wins = ps.wins + excluded.wins,
    losses = ps.losses + excluded.losses,
    ties = ps.ties + excluded.ties,
    last_game_at = greatest(ps.last_game_at, excluded.last_game_at);

  insert into public.player_stats_guests as pg (guest_id, games, wins, losses, ties, last_game_at)
  select p.guest_id, 1,
         sum((p.result = 'win')::int),
         sum((p.result = 'loss')::int),
         sum((p.result = 'tie')::int),
         o.completed_at
  from participants p
  where p.guest_id is not null
  group by p.guest_id
  on conflict (guest_id) do update set
    games = pg.games + excluded.games,
    wins = pg.wins + excluded.wins,
    losses = pg.losses + excluded.losses,
    ties = pg.ties + excluded.ties,
    last_game_at = greatest(pg.last_game_at, excluded.last_game_at);
end;
$$;

create or replace function public.fn_apply_game_outcome_to_stats()
returns trigger
language plpgsql
as $$
begin
  perform public.apply_outcome(new.game_id);
  return new;
end;
$$;

drop trigger if exists trg_apply_game_outcome_to_stats on public.spades_game_outcomes;

create trigger trg_apply_game_outcome_to_stats
after insert on public.spades_game_outcomes
for each row execute function public.fn_apply_game_outcome_to_stats();


