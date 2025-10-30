/**
 * TypeScript interfaces for the event/calendar system
 * These match the SQL schema defined in home_and_calendar_init.sql
 */

// ========= Enums =========
export type EventVisibility = 'public' | 'org_only' | 'group_only' | 'private';
export type EventStatus = 'draft' | 'published' | 'canceled';
export type RSVPStatus = 'interested' | 'going' | 'waitlisted' | 'not_going' | 'canceled_by_host';
export type AudienceType = 'group' | 'user';
export type FeedScope = 'group' | 'user';
export type MediaOwnerType = 'event_series' | 'group';

// ========= Core Types =========

/**
 * Group/organization that can host events
 */
export interface Group {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  created_by: string | null; // references profiles.user_id
  created_at: string;
}

/**
 * Membership in a group with role
 */
export interface GroupMember {
  grp_id: string;
  user_id: string; // references profiles.user_id
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

/**
 * User subscription to a group (for feeds/notifications)
 */
export interface Subscription {
  id: string;
  user_id: string; // references profiles.user_id
  grp_id: string;
  created_at: string;
}

/**
 * Controlled tags for categorizing events
 */
export interface Tag {
  id: string;
  slug: string;
  label: string;
  is_active: boolean;
  sort_order: number;
}

/**
 * Physical venue for events
 */
export interface Venue {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

/**
 * Media assets (images, etc.) for events or groups
 */
export interface MediaAsset {
  id: string;
  owner_type: MediaOwnerType;
  owner_id: string;
  url: string;
  mime: string | null;
  is_primary: boolean;
  sort_order: number;
  meta: Record<string, any>;
  created_at: string;
}

// ========= Event Types =========

/**
 * Event series/definition - the template for recurring events
 */
export interface EventSeries {
  id: string;
  grp_id: string;
  title: string;
  description_md: string | null;
  visibility: EventVisibility;
  status: EventStatus;
  timezone: string;
  all_day: boolean;
  rrule: string | null; // RRULE for recurrence
  recurrence_until: string | null;
  exdates: string[]; // timestamptz array
  rdates: string[]; // timestamptz array
  venue_id: string | null;
  location_text: string | null;
  is_virtual: boolean;
  join_url: string | null;
  rsvp_required: boolean;
  capacity: number | null;
  created_by: string | null; // references profiles.user_id
  created_at: string;
  updated_at: string;
}

/**
 * Audience allowlist for event discoverability
 */
export interface EventAudience {
  id: string;
  event_series_id: string;
  audience_type: AudienceType;
  audience_id: string; // group_id or user_id depending on type
}

/**
 * Tagging for event series
 */
export interface EventSeriesTag {
  event_series_id: string;
  tag_id: string;
}

/**
 * Materialized event occurrence (specific date/time instance)
 */
export interface EventInstance {
  id: string;
  event_series_id: string;
  occurrence_index: number;
  starts_at: string;
  ends_at: string;
  timezone: string;
  all_day: boolean;
  status: EventStatus;
  venue_id: string | null;
  location_text: string | null;
  is_virtual: boolean;
  join_url: string | null;
  capacity: number | null;
  overrides: Record<string, any>;
  spades_game_id: string | null; // optional link to spades game
  created_at: string;
}

/**
 * RSVP for a specific event instance
 */
export interface RSVP {
  id: string;
  event_instance_id: string;
  user_id: string; // references profiles.user_id
  status: RSVPStatus;
  guest_count: number;
  checked_in_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Notification rules for groups or event series
 */
export interface NotificationRule {
  id: string;
  scope: 'group' | 'event_series';
  scope_id: string;
  config: Record<string, any>;
}

/**
 * ICS feed configuration
 */
export interface ICSFeed {
  id: string;
  scope: FeedScope;
  scope_id: string;
  token: string;
  is_enabled: boolean;
  created_at: string;
}

// ========= Extended Types for UI =========

/**
 * Event instance with joined data for display
 */
export interface EventInstanceWithDetails extends EventInstance {
  event_series: EventSeries;
  group: Group;
  venue?: Venue;
  rsvp_count: number;
  user_rsvp?: RSVP;
}

/**
 * Group with member count and user's role
 */
export interface GroupWithDetails extends Group {
  member_count: number;
  user_role?: 'owner' | 'admin' | 'member';
  is_subscribed: boolean;
}

/**
 * Event series with tags and audience info
 */
export interface EventSeriesWithDetails extends EventSeries {
  tags: Tag[];
  audience: EventAudience[];
  group: Group;
}
