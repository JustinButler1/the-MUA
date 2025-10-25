# Unique Team Names Implementation

## Overview

Migration `009_unique_team_names.sql` enforces unique team names across the application.

## Changes Made

### Database Schema Changes

1. **Unique Constraint**

   - Added `teams_name_unique` constraint on `teams.name`
   - Ensures no two teams can have the same name (case-sensitive in database)
   - Made `name` column NOT NULL

2. **Case-Insensitive Index**

   - Created `teams_name_lower_idx` index on `LOWER(teams.name)`
   - Enables efficient case-insensitive lookups

3. **Helper Function**
   - Added `is_team_name_available(team_name TEXT)` function
   - Performs case-insensitive check for team name availability
   - Returns `true` if available, `false` if taken

### Data Migration

The migration automatically handles existing data:

- NULL or empty names are replaced with `Team_[id]`
- Duplicate names are numbered: `Original Name (1)`, `Original Name (2)`, etc.
- Teams are processed in order of creation (`created_at ASC`)

## Application Changes

### Team Creation (`app/teams/create.tsx`)

Enhanced the `handleSaveTeam` function to:

1. Check team name availability before creation using `is_team_name_available()` RPC
2. Handle unique constraint violations with user-friendly error messages
3. Provide specific feedback when a team name is already taken

## Usage

### Checking Team Name Availability

```typescript
const { data: isAvailable, error } = await supabase.rpc(
  "is_team_name_available",
  { team_name: "My Team" }
);

if (!isAvailable) {
  // Team name is taken
}
```

### Error Handling

The application now handles two scenarios:

1. **Preemptive Check**: Before creating a team, check if the name is available
2. **Constraint Violation**: If a race condition occurs, catch the PostgreSQL error code `23505`

## Testing

After running this migration:

1. Try creating a team with a duplicate name - should show "Team Name Taken" alert
2. Team name check is case-insensitive: "My Team" and "my team" are considered the same
3. Existing teams with duplicate names should be automatically renamed

## Rollback

To rollback this migration (not recommended for production):

```sql
-- Remove the function
DROP FUNCTION IF EXISTS public.is_team_name_available(TEXT);

-- Remove the index
DROP INDEX IF EXISTS public.teams_name_lower_idx;

-- Remove the unique constraint
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_name_unique;

-- Make name nullable again (optional)
ALTER TABLE public.teams ALTER COLUMN name DROP NOT NULL;
```

## Related Files

- Migration: `db/migrations/009_unique_team_names.sql`
- Team Creation: `app/teams/create.tsx`
- Database Schema: `DATABASE_SCHEMA.md`
