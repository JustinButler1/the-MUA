# Events & Calendar System Documentation

## Overview

This migration introduces a comprehensive event and calendar system to the MUA app, allowing groups to create and manage events with RSVP functionality, recurring events, and calendar integration.

## Database Schema

### Core Tables

#### Groups (`grp`)

- Hierarchical groups with parent-child relationships
- Each group can have multiple members with roles (owner, admin, member)
- Groups own event series and can have media assets

#### Event Series (`event_series`)

- Template/definition for events (can be recurring)
- Belongs to a group
- Contains default settings for location, capacity, RSVP requirements
- Supports RRULE for recurring events with exclusions and additions

#### Event Instances (`event_instance`)

- Materialized occurrences of event series
- Each instance represents a specific date/time
- Can override series defaults (location, capacity, etc.)
- Optional link to spades games via `spades_game_id`

#### RSVPs (`rsvp`)

- Per-instance RSVP tracking
- Statuses: interested, going, waitlisted, not_going, canceled_by_host
- Guest count support
- Automatic waitlist promotion when capacity frees up

### Supporting Tables

#### Subscriptions (`subscription`)

- Users subscribe to groups for feeds and notifications
- Enables the home feed to show events from subscribed groups

#### Venues (`venue`)

- Physical locations for events
- Optional geolocation data (lat/lng)

#### Tags (`tag`)

- Controlled vocabulary for categorizing events
- Can be applied to event series

#### Media Assets (`media_asset`)

- Images and other media for events or groups
- One primary asset per owner enforced by trigger

#### Notification Rules (`notification_rule`)

- Custom notification settings per group or event series
- Override default 24h + 2h notification timing

#### ICS Feeds (`ics_feed`)

- Calendar export functionality
- Both group-level and user-level feeds
- Public URLs with random tokens

## Key Features

### Event Visibility

Four levels of visibility:

- `public`: Visible to everyone
- `org_only`: Visible to organization members only
- `group_only`: Visible to group members only
- `private`: Visible only to specific audience allowlist

### Recurring Events

- Uses RRULE standard for recurrence patterns
- Supports exclusions (`exdates`) and additions (`rdates`)
- Materialized instances generated within publish window (e.g., 6 months)

### RSVP Management

- Capacity tracking with automatic waitlist promotion
- FIFO waitlist with admin override capability
- Guest count support
- Check-in tracking

### Group Hierarchy

- Groups can have parent-child relationships
- Subgroup members inherit access to parent group events
- Implemented via app logic (not database views for simplicity)

## Integration with Existing System

### User Management

- Uses existing `profiles` table instead of creating new user table
- All foreign keys reference `profiles(user_id)`

### Spades Games Integration

- Optional `spades_game_id` field in `event_instance`
- Allows linking scheduled games to calendar events
- Maintains separation between game system and event system

### Teams vs Groups

- Teams remain separate from groups
- Teams are for spades partnerships
- Groups are for event organization and chat pages
- No direct relationship between teams and groups

## Triggers and Functions

### Media Primary Enforcement

- `set_only_primary_media()`: Ensures only one primary media asset per owner
- Triggered on insert/update of `media_asset.is_primary`

### Waitlist Promotion

- `promote_waitlist_for_instance()`: Automatically promotes waitlisted users when capacity frees up
- Triggered on RSVP status changes and capacity updates
- FIFO ordering by `created_at`

## Home Feed Implementation

The home screen now displays upcoming events from groups the user is subscribed to:

- Fetches events via `getUserUpcomingEvents()` query
- Shows event cards with title, group, time, location, RSVP status
- Pull-to-refresh functionality
- Empty state when no events
- Error handling for network issues

## Calendar Tab

Calendar tab added to navigation as placeholder:

- Stub screen with "Calendar Coming Soon" message
- Prepared for future calendar view implementation
- Maintains consistent design with existing tabs

## Usage Examples

### Creating an Event Series

```sql
INSERT INTO event_series (grp_id, title, description_md, visibility, status)
VALUES ('group-uuid', 'Weekly Spades Night', 'Come play spades!', 'public', 'published');
```

### Creating Recurring Events

```sql
INSERT INTO event_series (grp_id, title, rrule, recurrence_until)
VALUES ('group-uuid', 'Weekly Meeting', 'FREQ=WEEKLY;BYDAY=TU', '2024-12-31');
```

### RSVP to Event

```sql
INSERT INTO rsvp (event_instance_id, user_id, status, guest_count)
VALUES ('instance-uuid', 'user-uuid', 'going', 1);
```

### Subscribe to Group

```sql
INSERT INTO subscription (user_id, grp_id)
VALUES ('user-uuid', 'group-uuid');
```

## Future Enhancements

- Calendar view with month/week/day views
- Event detail screens with full RSVP management
- Push notifications for event reminders
- Event creation and editing UI
- Group management interface
- ICS calendar export functionality
- Event search and filtering
- Event analytics and reporting
