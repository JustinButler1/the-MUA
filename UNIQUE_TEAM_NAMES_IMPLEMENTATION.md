# Unique Team Names Implementation Summary

## What Was Implemented

Enforced unique team names across the application with both database-level constraints and application-level validation.

## Files Changed

### 1. Database Migration

**File**: `db/migrations/009_unique_team_names.sql`

- Cleans up existing team names (handles NULL/empty values and duplicates)
- Adds `teams_name_unique` constraint to prevent duplicate names
- Creates `teams_name_lower_idx` index for efficient case-insensitive lookups
- Implements `is_team_name_available()` helper function
- Makes `teams.name` column NOT NULL

### 2. Team Creation Screen

**File**: `app/teams/create.tsx`

- Added preemptive team name availability check using RPC function
- Enhanced error handling for unique constraint violations
- Displays user-friendly "Team Name Taken" alert when duplicate detected

### 3. Documentation

**Files**:

- `db/migrations/README_UNIQUE_TEAM_NAMES.md` - Detailed implementation guide
- `DATABASE_SCHEMA.md` - Updated schema documentation
- `UNIQUE_TEAM_NAMES_IMPLEMENTATION.md` - This summary

## How It Works

### Database Layer

1. **Unique Constraint**: PostgreSQL enforces uniqueness at the database level
2. **Case-Insensitive Check**: The helper function checks names case-insensitively
3. **Automatic Cleanup**: Existing duplicates are renamed with numbers: "Team Name (1)", "Team Name (2)", etc.

### Application Layer

1. **Proactive Validation**: Before creating a team, checks if name is available
2. **Error Handling**: Catches PostgreSQL error code `23505` (unique violation)
3. **User Feedback**: Shows clear "Team Name Taken" message

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `db/migrations/009_unique_team_names.sql`
4. Paste and run the SQL script
5. Verify the constraint was added: Check the `teams` table schema

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI set up
supabase db push

# Or apply the migration file directly
psql -h [your-db-host] -U postgres -d postgres -f db/migrations/009_unique_team_names.sql
```

## Verification Steps

After applying the migration:

1. **Check the constraint exists**:

   ```sql
   SELECT conname, contype
   FROM pg_constraint
   WHERE conrelid = 'teams'::regclass
   AND conname = 'teams_name_unique';
   ```

2. **Test the helper function**:

   ```sql
   SELECT is_team_name_available('Test Team');
   -- Should return true if available, false if taken
   ```

3. **Test in the app**:
   - Try creating a team with a duplicate name
   - Should see "Team Name Taken" alert
   - Create a team with a unique name
   - Should succeed

## Key Features

✅ **Database-level enforcement**: Can't insert duplicate names even via direct SQL
✅ **Case-insensitive checking**: "My Team" and "my team" are treated as duplicates
✅ **Automatic data cleanup**: Existing duplicates are handled gracefully
✅ **User-friendly errors**: Clear feedback when team name is taken
✅ **Race condition protection**: Both proactive check AND constraint violation handling

## Technical Details

- Constraint Name: `teams_name_unique`
- Index Name: `teams_name_lower_idx`
- Helper Function: `is_team_name_available(team_name TEXT)`
- PostgreSQL Error Code for duplicates: `23505`

## Notes

- Team names are case-sensitive in the database but checked case-insensitively in the application
- The migration preserves all existing teams by renaming duplicates
- The constraint prevents future duplicates from being created
- Similar implementation pattern as the unique username feature (migration 007)
