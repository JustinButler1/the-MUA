# Database Schema Summary

## Tables Overview

### 1. profiles

**Purpose**: User profile information

- `user_id` (uuid, PK) - References auth.users.id
- `display_name` (text, NOT NULL, UNIQUE) - User's username/display name
  - **Format**: 3-20 characters, alphanumeric, underscores, hyphens only
  - **Unique Constraint**: Case-sensitive unique, with case-insensitive index
- `avatar_url` (text, nullable) - URL to user's avatar
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Constraints**:
  - `profiles_display_name_unique`: Ensures unique usernames
  - `profiles_display_name_format`: Enforces username format (^[a-zA-Z0-9_-]{3,20}$)
- **Indexes**:
  - `profiles_display_name_lower_idx`: Case-insensitive lookup index
- **Rows**: 2

### 2. teams

**Purpose**: Team/partnership information for games

- `id` (uuid, PK) - Default: gen_random_uuid()
- `name` (text, nullable) - Team name
- `created_by` (uuid) - References profiles.user_id
- `created_at` (timestamptz, nullable) - Default: now()
- `archived` (boolean, nullable)
- **RLS**: Disabled
- **Rows**: 4

### 3. team_members

**Purpose**: Links users/guests to teams

- `team_id` (uuid, PK) - References teams.id
- `slot` (smallint, PK) - Must be 1 or 2
- `user_id` (uuid, nullable) - References profiles.user_id
- `guest_id` (uuid, nullable) - References team_guests.id
- **RLS**: Disabled
- **Rows**: 8
- **Note**: Either user_id or guest_id should be set, not both

### 4. team_guests

**Purpose**: Guest players (non-registered users)

- `id` (uuid, PK) - Default: gen_random_uuid()
- `team_id` (uuid) - References teams.id
- `display_name` (text) - Guest's display name
- `created_at` (timestamptz, nullable) - Default: now()
- **RLS**: Disabled
- **Rows**: 4

### 5. spades_games

**Purpose**: Main game records for Spades

- `id` (uuid, PK) - Default: gen_random_uuid()
- `created_by` (uuid) - References profiles.user_id
- `team1_id` (uuid) - References teams.id
- `team2_id` (uuid) - References teams.id
- `goal_score` (integer) - Default: 500
- `status` (text) - Default: 'in_progress'
- `started_at` (timestamptz, nullable) - Default: now()
- `ended_at` (timestamptz, nullable)
- **RLS**: Disabled
- **Rows**: 2

### 6. spades_hands

**Purpose**: Individual hand records within a game

- `id` (bigint, PK) - Auto-increment
- `game_id` (uuid) - References spades_games.id
- `hand_no` (integer) - Hand number in the game
- `team1_bid` (integer) - Team 1's bid
- `team2_bid` (integer) - Team 2's bid
- `team1_books` (integer) - Books won by team 1
- `team2_books` (integer) - Books won by team 2
- `team1_delta` (integer) - Points change for team 1
- `team2_delta` (integer) - Points change for team 2
- `team1_total_after` (integer) - Team 1's total score after this hand
- `team2_total_after` (integer) - Team 2's total score after this hand
- **RLS**: Disabled
- **Rows**: 2

### 7. spades_game_outcomes

**Purpose**: Final game outcomes (completed games)

- `game_id` (uuid, PK) - Game identifier
- `team1_id` (uuid) - Team 1 identifier
- `team2_id` (uuid) - Team 2 identifier
- `team1_total` (integer) - Team 1's final score
- `team2_total` (integer) - Team 2's final score
- `winner_team_id` (uuid, nullable) - Winning team (null if tie)
- `completed_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Rows**: 1
- **Note**: Marked as duplicate in schema

### 8. spades_game_team_members

**Purpose**: Snapshot of team members at game time

- `game_id` (uuid, PK)
- `team_id` (uuid, PK)
- `slot` (smallint, PK) - Must be 1 or 2
- `user_id` (uuid, nullable)
- `guest_id` (uuid, nullable)
- **RLS**: Disabled
- **Rows**: 0

### 9. team_stats

**Purpose**: Aggregated statistics per team

- `team_id` (uuid, PK) - References teams.id
- `games` (integer) - Default: 0
- `wins` (integer) - Default: 0
- `losses` (integer) - Default: 0
- `ties` (integer) - Default: 0
- `points_for` (integer) - Default: 0
- `points_against` (integer) - Default: 0
- `last_game_at` (timestamptz, nullable)
- **RLS**: Disabled
- **Rows**: 0

### 10. player_stats_users

**Purpose**: Aggregated statistics per registered user

- `user_id` (uuid, PK) - References profiles.user_id
- `games` (integer) - Default: 0
- `wins` (integer) - Default: 0
- `losses` (integer) - Default: 0
- `ties` (integer) - Default: 0
- `last_game_at` (timestamptz, nullable)
- **RLS**: Disabled
- **Rows**: 0

### 11. player_stats_guests

**Purpose**: Aggregated statistics per guest player

- `guest_id` (uuid, PK) - References team_guests.id
- `games` (integer) - Default: 0
- `wins` (integer) - Default: 0
- `losses` (integer) - Default: 0
- `ties` (integer) - Default: 0
- `last_game_at` (timestamptz, nullable)
- **RLS**: Disabled
- **Rows**: 0

## Relationships

### Profile-Team Relationships

- profiles → teams (created_by)
- profiles → team_members (user_id)

### Team Relationships

- teams → team_members (team_id)
- teams → spades_games (team1_id, team2_id)
- teams → team_guests (team_id)

### Game Relationships

- spades_games → spades_hands (game_id)
- spades_games → spades_game_outcomes (game_id)
- spades_games → spades_game_team_members (game_id)

### Stats Relationships

- player_stats_users references profiles.user_id
- player_stats_guests references team_guests.guest_id
- team_stats references teams.team_id

## Helper Functions

### is_username_available(username TEXT)

**Purpose**: Check if a username is available (case-insensitive)

**Returns**: BOOLEAN

- `true` if username is available
- `false` if username is taken

**Usage**: Called from frontend to validate username availability during signup/profile update

## Notes

1. **RLS (Row Level Security)** is currently disabled on all tables
2. **Stats tables** (player_stats_users, player_stats_guests, team_stats) are currently empty - these should be populated via triggers or scheduled jobs when games are completed
3. **spades_game_team_members** is empty - this should be populated when games start to create a snapshot
4. **Guest vs User players**: The system supports both registered users and guest players through the dual user_id/guest_id columns
5. **Username Uniqueness**: As of migration 007, usernames (display_name) are enforced as unique with format validation. The uniqueness is case-sensitive in the database but checked case-insensitively in the application
