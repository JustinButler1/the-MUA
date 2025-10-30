-- ========= Enums =========
CREATE TYPE event_visibility AS ENUM ('public','org_only','group_only','private');
CREATE TYPE event_status     AS ENUM ('draft','published','canceled');
CREATE TYPE rsvp_status      AS ENUM ('interested','going','waitlisted','not_going','canceled_by_host');
CREATE TYPE audience_type    AS ENUM ('group','user');
CREATE TYPE feed_scope       AS ENUM ('group','user');
CREATE TYPE media_owner_type AS ENUM ('event_series','group');

-- ========= Core =========
-- Note: Using existing profiles table instead of app_user
-- profiles table already exists with user_id (uuid, PK), display_name (text), avatar_url (text), created_at (timestamptz)

-- Hierarchical groups (subgroups via parent_id)
CREATE TABLE grp (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     uuid REFERENCES grp(id) ON DELETE SET NULL,
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  description   text,
  created_by    uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE grp_member (
  grp_id        uuid REFERENCES grp(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  role          text CHECK (role IN ('owner','admin','member')) NOT NULL DEFAULT 'member',
  joined_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grp_id, user_id)
);

-- Users subscribe to groups/subgroups (feeds + notifications + ICS)
CREATE TABLE subscription (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  grp_id        uuid NOT NULL REFERENCES grp(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, grp_id)
);

-- Controlled tags
CREATE TABLE tag (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL,
  label       text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0
);

-- Optional physical venue
CREATE TABLE venue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  address       text,
  lat           double precision,
  lng           double precision,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Media (many assets; one primary per owner)
CREATE TABLE media_asset (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type    media_owner_type NOT NULL,
  owner_id      uuid NOT NULL,
  url           text NOT NULL,
  mime          text,
  is_primary    boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  meta          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- One primary per owner
CREATE UNIQUE INDEX ux_media_primary_one
  ON media_asset(owner_type, owner_id)
  WHERE is_primary;

-- ========= Events =========
-- Event "definition" (series) – belongs to a group (required)
CREATE TABLE event_series (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grp_id           uuid NOT NULL REFERENCES grp(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description_md   text,
  visibility       event_visibility NOT NULL DEFAULT 'public',
  status           event_status NOT NULL DEFAULT 'draft',
  timezone         text NOT NULL DEFAULT 'America/New_York',
  all_day          boolean NOT NULL DEFAULT false,
  -- Recurrence (RRULE/EXDATE/RDATE); leave rrule NULL for one-off
  rrule            text,
  recurrence_until timestamptz,
  exdates          timestamptz[] DEFAULT '{}',     -- optional explicit exclusions
  rdates           timestamptz[] DEFAULT '{}',     -- optional explicit additions
  -- Default location (can be overridden per instance)
  venue_id         uuid REFERENCES venue(id) ON DELETE SET NULL,
  location_text    text,
  is_virtual       boolean NOT NULL DEFAULT false,
  join_url         text,
  -- RSVP / capacity (instance can override)
  rsvp_required    boolean NOT NULL DEFAULT true,
  capacity         integer CHECK (capacity IS NULL OR capacity >= 0),
  -- Media handled via media_asset(owner_type='event_series', owner_id=id)
  created_by       uuid REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Discoverability allowlist (groups/subgroups + specific users)
CREATE TABLE event_audience (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_series_id  uuid NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  audience_type    audience_type NOT NULL,
  audience_id      uuid NOT NULL
);
CREATE UNIQUE INDEX ux_event_audience_dedup
  ON event_audience(event_series_id, audience_type, audience_id);

-- Tagging
CREATE TABLE event_series_tag (
  event_series_id uuid REFERENCES event_series(id) ON DELETE CASCADE,
  tag_id          uuid REFERENCES tag(id) ON DELETE CASCADE,
  PRIMARY KEY (event_series_id, tag_id)
);

-- Materialized occurrences (publish window, e.g., 6 months rolling)
CREATE TABLE event_instance (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_series_id  uuid NOT NULL REFERENCES event_series(id) ON DELETE CASCADE,
  occurrence_index integer NOT NULL,  -- 0,1,2...
  starts_at        timestamptz NOT NULL,
  ends_at          timestamptz NOT NULL,
  timezone         text NOT NULL,
  all_day          boolean NOT NULL DEFAULT false,
  status           event_status NOT NULL DEFAULT 'published', -- per-date cancel/edit
  -- Per-instance overrides (location/capacity/virtual)
  venue_id         uuid REFERENCES venue(id) ON DELETE SET NULL,
  location_text    text,
  is_virtual       boolean NOT NULL DEFAULT false,
  join_url         text,
  capacity         integer CHECK (capacity IS NULL OR capacity >= 0),
  overrides        jsonb NOT NULL DEFAULT '{}'::jsonb, -- which fields deviate
  spades_game_id   uuid REFERENCES spades_games(id) ON DELETE SET NULL, -- optional link to spades game
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_series_id, occurrence_index),
  CHECK (starts_at < ends_at)
);
CREATE INDEX ix_event_instance_starts_at ON event_instance(starts_at);
CREATE INDEX ix_event_instance_series_time ON event_instance(event_series_id, starts_at);

-- RSVPs (per occurrence)
CREATE TABLE rsvp (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_instance_id uuid NOT NULL REFERENCES event_instance(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status            rsvp_status NOT NULL DEFAULT 'interested',
  guest_count       integer NOT NULL DEFAULT 0 CHECK (guest_count >= 0),
  checked_in_at     timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_instance_id, user_id)
);
CREATE INDEX ix_rsvp_instance_status ON rsvp(event_instance_id, status);

-- Notification rules (override default 24h + 2h)
CREATE TABLE notification_rule (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      text CHECK (scope IN ('group','event_series')) NOT NULL,
  scope_id   uuid NOT NULL,
  config     jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (scope, scope_id)
);

-- ICS feeds (group AND user)
CREATE TABLE ics_feed (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      feed_scope NOT NULL, -- 'group' or 'user'
  scope_id   uuid NOT NULL,
  token      text UNIQUE NOT NULL, -- random token for public ICS URL
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_id)
);

-- ========= Indexing for discovery/search/sort =========
-- Title/desc search later (GIN tsvector); keep simple for now:
CREATE INDEX ix_event_series_grp           ON event_series(grp_id);
CREATE INDEX ix_event_series_visibility    ON event_series(visibility);
CREATE INDEX ix_event_audience_lookup      ON event_audience(audience_type, audience_id);

-- Group hierarchy helpers
CREATE INDEX ix_grp_parent ON grp(parent_id);

-- ========= Helpers & Triggers =========

-- 1) Enforce only one primary media per owner (already via partial unique index).
-- Optional: auto-clear other primaries if one is set to true.
CREATE OR REPLACE FUNCTION set_only_primary_media()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE media_asset
      SET is_primary = false
      WHERE owner_type = NEW.owner_type
        AND owner_id   = NEW.owner_id
        AND id <> NEW.id
        AND is_primary = true;
  END IF;
  RETURN NEW;
END$$;

CREATE TRIGGER trg_media_primary
AFTER INSERT OR UPDATE OF is_primary ON media_asset
FOR EACH ROW EXECUTE FUNCTION set_only_primary_media();

-- 2) Waitlist auto-promotion (FIFO with admin override)
-- Seats used = SUM(1 + guest_count) for status='going'
-- When an RSVP becomes 'not_going'/'canceled_by_host' OR capacity increases,
-- promote earliest 'waitlisted' (by created_at) until seats <= capacity.
CREATE OR REPLACE FUNCTION promote_waitlist_if_capacity()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rec RECORD;
  cap integer;
  used integer;
BEGIN
  FOR rec IN
    SELECT ei.id AS event_instance_id,
           COALESCE(ei.capacity, es.capacity) AS capacity
    FROM event_instance ei
    JOIN event_series es ON es.id = ei.event_series_id
    WHERE (ei.capacity IS NOT NULL OR es.capacity IS NOT NULL)
  LOOP
    cap := rec.capacity;
    IF cap IS NULL THEN CONTINUE; END IF;

    LOOP
      SELECT COALESCE(SUM(1 + guest_count),0)
      INTO used
      FROM rsvp
      WHERE event_instance_id = rec.event_instance_id
        AND status = 'going';

      EXIT WHEN used < cap;

      -- If full or over, stop
      IF used >= cap THEN EXIT; END IF;
    END LOOP;
  END LOOP;
END$$;

-- Simpler, targeted version: run on RSVP changes for a specific instance
CREATE OR REPLACE FUNCTION promote_waitlist_for_instance()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cap integer;
  used integer;
  promote_id uuid;
BEGIN
  -- Determine capacity
  SELECT COALESCE(ei.capacity, es.capacity)
    INTO cap
  FROM event_instance ei
  JOIN event_series es ON es.id = ei.event_series_id
  WHERE ei.id = COALESCE(NEW.event_instance_id, OLD.event_instance_id);

  IF cap IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recompute used seats
  SELECT COALESCE(SUM(1 + guest_count),0)
    INTO used
  FROM rsvp
  WHERE event_instance_id = COALESCE(NEW.event_instance_id, OLD.event_instance_id)
    AND status = 'going';

  -- If seats available, promote earliest waitlisted
  IF used < cap THEN
    SELECT id
      INTO promote_id
    FROM rsvp
    WHERE event_instance_id = COALESCE(NEW.event_instance_id, OLD.event_instance_id)
      AND status = 'waitlisted'
    ORDER BY created_at ASC
    LIMIT 1;

    IF promote_id IS NOT NULL THEN
      UPDATE rsvp
        SET status = 'going',
            updated_at = now()
      WHERE id = promote_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END$$;

-- Trigger on RSVP updates that may free capacity or on insert to waitlist
CREATE TRIGGER trg_rsvp_promote_on_change
AFTER INSERT OR UPDATE OF status, guest_count ON rsvp
FOR EACH ROW EXECUTE FUNCTION promote_waitlist_for_instance();

-- Also promote when instance capacity changes
CREATE TRIGGER trg_instance_capacity_change
AFTER UPDATE OF capacity ON event_instance
FOR EACH ROW EXECUTE FUNCTION promote_waitlist_for_instance();

-- ========= Business rules you asked for =========
-- Visibility: keep four levels; subgroup members should see parent events (inheritance).
-- Implement inheritance in app logic or via a helper view that resolves a user’s effective groups.

-- Example helper view (effective memberships including ancestors):
-- (Keep simple; do hierarchy resolution in code if you prefer.)
-- CREATE RECURSIVE VIEW v_user_groups AS (
--   SELECT gm.user_id, g.id AS grp_id
--   FROM grp_member gm JOIN grp g ON g.id = gm.grp_id
--   UNION
--   SELECT v.user_id, g.parent_id
--   FROM v_user_groups v JOIN grp g ON g.id = v.grp_id
--   WHERE g.parent_id IS NOT NULL
-- );

