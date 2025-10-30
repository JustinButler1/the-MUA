# Database Schema Summary

## Tables Overview

### Core User & Game Tables

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
- `name` (text, NOT NULL, UNIQUE) - Team name
- `created_by` (uuid) - References profiles.user_id
- `created_at` (timestamptz, nullable) - Default: now()
- `archived` (boolean, nullable)
- **RLS**: Disabled
- **Constraints**:
  - `teams_name_unique`: Ensures unique team names
- **Indexes**:
  - `teams_name_lower_idx`: Case-insensitive lookup index
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

## Event & Calendar System Tables

### 12. grp

**Purpose**: Groups/organizations that can host events

- `id` (uuid, PK) - Default: gen_random_uuid()
- `parent_id` (uuid, nullable) - References grp(id) for hierarchy
- `name` (text, NOT NULL) - Group name
- `slug` (text, UNIQUE, NOT NULL) - URL-friendly identifier
- `description` (text, nullable) - Group description
- `created_by` (uuid, nullable) - References profiles.user_id
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled

### 13. grp_member

**Purpose**: Group membership with roles

- `grp_id` (uuid, PK) - References grp.id
- `user_id` (uuid, PK) - References profiles.user_id
- `role` (text) - 'owner', 'admin', or 'member'
- `joined_at` (timestamptz) - Default: now()
- **RLS**: Disabled

### 14. subscription

**Purpose**: User subscriptions to groups for feeds/notifications

- `id` (uuid, PK) - Default: gen_random_uuid()
- `user_id` (uuid, NOT NULL) - References profiles.user_id
- `grp_id` (uuid, NOT NULL) - References grp.id
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Constraints**: UNIQUE (user_id, grp_id)

### 15. event_series

**Purpose**: Event definitions/templates (can be recurring)

- `id` (uuid, PK) - Default: gen_random_uuid()
- `grp_id` (uuid, NOT NULL) - References grp.id
- `title` (text, NOT NULL) - Event title
- `description_md` (text, nullable) - Markdown description
- `visibility` (event_visibility) - 'public', 'org_only', 'group_only', 'private'
- `status` (event_status) - 'draft', 'published', 'canceled'
- `timezone` (text) - Default: 'America/New_York'
- `all_day` (boolean) - Default: false
- `rrule` (text, nullable) - RRULE for recurrence
- `recurrence_until` (timestamptz, nullable) - End of recurrence
- `exdates` (timestamptz[]) - Explicit exclusions
- `rdates` (timestamptz[]) - Explicit additions
- `venue_id` (uuid, nullable) - References venue.id
- `location_text` (text, nullable) - Location description
- `is_virtual` (boolean) - Default: false
- `join_url` (text, nullable) - Virtual meeting URL
- `rsvp_required` (boolean) - Default: true
- `capacity` (integer, nullable) - Max attendees
- `created_by` (uuid, nullable) - References profiles.user_id
- `created_at` (timestamptz) - Default: now()
- `updated_at` (timestamptz) - Default: now()
- **RLS**: Disabled

### 16. event_instance

**Purpose**: Materialized event occurrences (specific date/time)

- `id` (uuid, PK) - Default: gen_random_uuid()
- `event_series_id` (uuid, NOT NULL) - References event_series.id
- `occurrence_index` (integer, NOT NULL) - 0,1,2...
- `starts_at` (timestamptz, NOT NULL) - Event start time
- `ends_at` (timestamptz, NOT NULL) - Event end time
- `timezone` (text, NOT NULL) - Instance timezone
- `all_day` (boolean) - Default: false
- `status` (event_status) - Default: 'published'
- `venue_id` (uuid, nullable) - References venue.id
- `location_text` (text, nullable) - Override location
- `is_virtual` (boolean) - Default: false
- `join_url` (text, nullable) - Override meeting URL
- `capacity` (integer, nullable) - Override capacity
- `overrides` (jsonb) - Which fields deviate from series
- `spades_game_id` (uuid, nullable) - Optional link to spades_games.id
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Constraints**: UNIQUE (event_series_id, occurrence_index), CHECK (starts_at < ends_at)

### 17. rsvp

**Purpose**: RSVPs for specific event instances

- `id` (uuid, PK) - Default: gen_random_uuid()
- `event_instance_id` (uuid, NOT NULL) - References event_instance.id
- `user_id` (uuid, NOT NULL) - References profiles.user_id
- `status` (rsvp_status) - 'interested', 'going', 'waitlisted', 'not_going', 'canceled_by_host'
- `guest_count` (integer) - Default: 0, additional guests
- `checked_in_at` (timestamptz, nullable) - Check-in timestamp
- `created_at` (timestamptz) - Default: now()
- `updated_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Constraints**: UNIQUE (event_instance_id, user_id)

### 18. venue

**Purpose**: Physical venues for events

- `id` (uuid, PK) - Default: gen_random_uuid()
- `name` (text, NOT NULL) - Venue name
- `address` (text, nullable) - Full address
- `lat` (double precision, nullable) - Latitude
- `lng` (double precision, nullable) - Longitude
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled

### 19. tag

**Purpose**: Controlled vocabulary for event categorization

- `id` (uuid, PK) - Default: gen_random_uuid()
- `slug` (text, UNIQUE, NOT NULL) - URL-friendly identifier
- `label` (text, NOT NULL) - Display name
- `is_active` (boolean) - Default: true
- `sort_order` (integer) - Default: 0
- **RLS**: Disabled

### 20. event_series_tag

**Purpose**: Many-to-many relationship between events and tags

- `event_series_id` (uuid, PK) - References event_series.id
- `tag_id` (uuid, PK) - References tag.id
- **RLS**: Disabled

### 21. event_audience

**Purpose**: Audience allowlist for event discoverability

- `id` (uuid, PK) - Default: gen_random_uuid()
- `event_series_id` (uuid, NOT NULL) - References event_series.id
- `audience_type` (audience_type) - 'group' or 'user'
- `audience_id` (uuid, NOT NULL) - Group ID or user ID
- **RLS**: Disabled
- **Constraints**: UNIQUE (event_series_id, audience_type, audience_id)

### 22. media_asset

**Purpose**: Media files (images, etc.) for events or groups

- `id` (uuid, PK) - Default: gen_random_uuid()
- `owner_type` (media_owner_type) - 'event_series' or 'group'
- `owner_id` (uuid, NOT NULL) - References event_series.id or grp.id
- `url` (text, NOT NULL) - Media URL
- `mime` (text, nullable) - MIME type
- `is_primary` (boolean) - Default: false
- `sort_order` (integer) - Default: 0
- `meta` (jsonb) - Default: '{}'
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Constraints**: UNIQUE (owner_type, owner_id) WHERE is_primary

### 23. notification_rule

**Purpose**: Custom notification settings

- `id` (uuid, PK) - Default: gen_random_uuid()
- `scope` (text) - 'group' or 'event_series'
- `scope_id` (uuid, NOT NULL) - Group ID or event series ID
- `config` (jsonb) - Default: '{}'
- **RLS**: Disabled
- **Constraints**: UNIQUE (scope, scope_id)

### 24. ics_feed

**Purpose**: Calendar export feeds

- `id` (uuid, PK) - Default: gen_random_uuid()
- `scope` (feed_scope) - 'group' or 'user'
- `scope_id` (uuid, NOT NULL) - Group ID or user ID
- `token` (text, UNIQUE, NOT NULL) - Random token for public URL
- `is_enabled` (boolean) - Default: true
- `created_at` (timestamptz) - Default: now()
- **RLS**: Disabled
- **Constraints**: UNIQUE (scope, scope_id)

## Relationships

### Core User & Game Relationships

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

### Event & Calendar Relationships

### Profile-Group Relationships

- profiles → grp (created_by)
- profiles → grp_member (user_id)
- profiles → subscription (user_id)
- profiles → event_series (created_by)
- profiles → rsvp (user_id)

### Group Relationships

- grp → grp (parent_id) - hierarchical groups
- grp → grp_member (grp_id)
- grp → subscription (grp_id)
- grp → event_series (grp_id)
- grp → media_asset (owner_id where owner_type='group')

### Event Relationships

- event_series → grp (grp_id)
- event_series → venue (venue_id)
- event_series → profiles (created_by)
- event_series → event_instance (event_series_id)
- event_series → event_series_tag (event_series_id)
- event_series → event_audience (event_series_id)
- event_series → media_asset (owner_id where owner_type='event_series')
- event_instance → event_series (event_series_id)
- event_instance → venue (venue_id)
- event_instance → spades_games (spades_game_id)
- event_instance → rsvp (event_instance_id)

### RSVP Relationships

- rsvp → event_instance (event_instance_id)
- rsvp → profiles (user_id)

### Supporting Relationships

- venue → event_series (venue_id)
- venue → event_instance (venue_id)
- tag → event_series_tag (tag_id)
- notification_rule → grp (scope_id where scope='group')
- notification_rule → event_series (scope_id where scope='event_series')
- ics_feed → grp (scope_id where scope='group')
- ics_feed → profiles (scope_id where scope='user')

## Helper Functions

### Username & Team Management

### is_username_available(username TEXT)

**Purpose**: Check if a username is available (case-insensitive)

**Returns**: BOOLEAN

- `true` if username is available
- `false` if username is taken

**Usage**: Called from frontend to validate username availability during signup/profile update

### is_team_name_available(team_name TEXT)

**Purpose**: Check if a team name is available (case-insensitive)

**Returns**: BOOLEAN

- `true` if team name is available
- `false` if team name is taken

**Usage**: Called from frontend to validate team name availability during team creation

### Event & Calendar Functions

### set_only_primary_media()

**Purpose**: Ensures only one primary media asset per owner (event_series or group)

**Trigger**: AFTER INSERT OR UPDATE OF is_primary ON media_asset

**Behavior**: When a media asset is set as primary, automatically sets all other assets for the same owner to non-primary

### promote_waitlist_for_instance()

**Purpose**: Automatically promotes waitlisted users when event capacity frees up

**Trigger**: AFTER INSERT OR UPDATE OF status, guest_count ON rsvp
**Trigger**: AFTER UPDATE OF capacity ON event_instance

**Behavior**:

- Calculates current capacity usage (going RSVPs + guest counts)
- If capacity available, promotes earliest waitlisted user (by created_at)
- Maintains FIFO ordering for fair waitlist management

## Notes

### Core System

1. **RLS (Row Level Security)** is currently disabled on all tables
2. **Stats tables** (player_stats_users, player_stats_guests, team_stats) are currently empty - these should be populated via triggers or scheduled jobs when games are completed
3. **spades_game_team_members** is empty - this should be populated when games start to create a snapshot
4. **Guest vs User players**: The system supports both registered users and guest players through the dual user_id/guest_id columns
5. **Username Uniqueness**: As of migration 007, usernames (display_name) are enforced as unique with format validation. The uniqueness is case-sensitive in the database but checked case-insensitively in the application

### Event & Calendar System

6. **Event Series vs Instances**: Event series are templates that can generate multiple instances (for recurring events). Instances are the actual occurrences with specific dates/times.
7. **Recurring Events**: Uses RRULE standard for recurrence patterns. Instances are materialized within a publish window (typically 6 months).
8. **Group Hierarchy**: Groups can have parent-child relationships. Subgroup members inherit access to parent group events (implemented in app logic).
9. **RSVP Waitlist**: Automatic FIFO promotion when capacity frees up, with admin override capability.
10. **Event Visibility**: Four levels (public, org_only, group_only, private) with audience allowlists for private events.
11. **Spades Integration**: Optional `spades_game_id` field allows linking scheduled games to calendar events while maintaining system separation.
12. **Media Assets**: One primary asset per owner enforced by database trigger.
13. **Calendar Export**: ICS feeds available for both groups and users with public URLs using random tokens.
