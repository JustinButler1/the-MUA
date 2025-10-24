# Username Uniqueness Migration

## Overview

This migration enforces unique usernames (display_name) across your application. It includes:

1. **Database Migration** (`007_unique_username.sql`)
2. **Frontend Validation** (`lib/username-validation.ts`)
3. **Updated Sign-up Flow** with real-time username validation
4. **Username Management** in account settings

## Changes Made

### Database Changes

The migration `007_unique_username.sql` does the following:

1. **Resolves Duplicate Usernames**: Before applying the unique constraint, any existing duplicate usernames are automatically renamed by appending `_1`, `_2`, etc.

2. **Adds UNIQUE Constraint**: Makes `display_name` unique across all profiles (case-sensitive)

3. **Creates Lowercase Index**: Adds an index on `LOWER(display_name)` for case-insensitive lookups

4. **Adds Format Validation**: Enforces username format rules:

   - 3-20 characters
   - Only alphanumeric characters, underscores, and hyphens
   - No spaces

5. **Makes display_name Required**: Sets `NOT NULL` constraint

6. **Adds Helper Function**: Creates `is_username_available(username TEXT)` function for checking availability

### Frontend Changes

1. **Username Validation Library** (`lib/username-validation.ts`):

   - `validateUsernameFormat()` - Validates username format
   - `checkUsernameAvailability()` - Checks if username is available (case-insensitive)
   - `updateUsername()` - Updates a user's username with validation

2. **Sign-up Screen** (`app/(auth)/sign-up.tsx`):

   - Real-time username validation with debouncing (500ms)
   - Visual feedback: loading spinner, checkmark, error messages
   - Prevents submission with invalid/taken usernames
   - Shows format requirements

3. **Account Management** (`app/(tabs)/profile/account.tsx`):
   - Added Account Settings section with username editing
   - Modal for changing username with validation
   - Shows current username and email

## How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. Log in to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `db/migrations/007_unique_username.sql`
4. Paste and run the SQL
5. Verify the changes in the **Table Editor**

### Option 2: Using Supabase CLI

```bash
# Apply the migration
supabase migration up

# Or if you're using the Supabase CLI with your remote database
supabase db push
```

### Option 3: Manual SQL Execution

Connect to your PostgreSQL database and execute:

```bash
psql -h your-db-host -U your-username -d your-database -f db/migrations/007_unique_username.sql
```

## Testing the Migration

### 1. Test Existing Users

After running the migration, check if any usernames were modified:

```sql
SELECT user_id, display_name
FROM profiles
WHERE display_name LIKE '%__%';
```

### 2. Test Uniqueness Constraint

Try creating duplicate usernames (should fail):

```sql
-- This should fail with "duplicate key value violates unique constraint"
INSERT INTO profiles (user_id, display_name)
VALUES (gen_random_uuid(), 'existingusername');
```

### 3. Test Format Validation

Try invalid usernames (should fail):

```sql
-- Too short (should fail)
INSERT INTO profiles (user_id, display_name)
VALUES (gen_random_uuid(), 'ab');

-- Invalid characters (should fail)
INSERT INTO profiles (user_id, display_name)
VALUES (gen_random_uuid(), 'user name');

-- Valid username (should succeed)
INSERT INTO profiles (user_id, display_name)
VALUES (gen_random_uuid(), 'valid_user123');
```

## Username Format Rules

- **Length**: 3-20 characters
- **Allowed characters**:
  - Lowercase letters (a-z)
  - Uppercase letters (A-Z)
  - Numbers (0-9)
  - Underscores (\_)
  - Hyphens (-)
- **Not allowed**:
  - Spaces
  - Special characters (@, #, $, %, etc.)
  - Emojis

## Frontend Usage

### Validating Username Format

```typescript
import { validateUsernameFormat } from "@/lib/username-validation";

const result = validateUsernameFormat("myusername");
if (result.valid) {
  console.log("Valid username format");
} else {
  console.log("Error:", result.error);
}
```

### Checking Username Availability

```typescript
import { checkUsernameAvailability } from "@/lib/username-validation";

// For new users
const result = await checkUsernameAvailability("myusername");

// For existing users (excludes their own username)
const result = await checkUsernameAvailability("newusername", currentUserId);

if (result.available) {
  console.log("Username is available");
} else {
  console.log("Error:", result.error);
}
```

### Updating Username

```typescript
import { updateUsername } from "@/lib/username-validation";

const result = await updateUsername(userId, "newusername");
if (result.success) {
  console.log("Username updated");
} else {
  console.log("Error:", result.error);
}
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove the function
DROP FUNCTION IF EXISTS public.is_username_available(TEXT);

-- Remove the index
DROP INDEX IF EXISTS profiles_display_name_lower_idx;

-- Remove the check constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_display_name_format;

-- Make display_name nullable again (if desired)
ALTER TABLE public.profiles
ALTER COLUMN display_name DROP NOT NULL;

-- Remove the unique constraint
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_display_name_unique;
```

## Notes

- **Case Sensitivity**: The unique constraint is case-sensitive at the database level, but the frontend checks are case-insensitive to prevent confusion (e.g., "User" and "user" are treated as the same)
- **Existing Users**: Any users with duplicate usernames will have numbers appended automatically
- **Email as Fallback**: If a profile doesn't have a username set, the email prefix is used as a fallback in the UI
- **RLS Considerations**: The migration uses `SECURITY DEFINER` for the helper function. Ensure your RLS policies are properly configured

## Support

If you encounter any issues:

1. Check the database logs for constraint violation errors
2. Verify all existing profiles have valid display_name values
3. Ensure the Supabase client library is up to date
4. Check that the frontend has proper error handling for unique constraint violations
