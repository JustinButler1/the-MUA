# Username Sign-In Migration

This migration adds support for signing in with username (in addition to email).

## What it does

Creates a database function `get_email_from_username()` that:

- Takes a username as input
- Looks up the corresponding email address from the profiles and auth.users tables
- Returns the email (case-insensitive username matching)
- Allows both authenticated and anonymous users to call it

## How to apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `008_username_to_email_lookup.sql`
5. Click **Run** to execute

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI configured
supabase db push
```

### Option 3: Manual psql

```bash
psql <your-database-connection-string> < db/migrations/008_username_to_email_lookup.sql
```

## Usage

Once the migration is applied, users can sign in using either:

- Their email address: `user@example.com`
- Their username: `cooluser123`

The app automatically detects which one is being used (if it contains `@`, it's treated as an email, otherwise as a username).

## Testing

After applying the migration, you can test it in the SQL Editor:

```sql
-- Test the function
SELECT get_email_from_username('your_test_username');

-- Should return the email associated with that username
```

## Security

The function uses `SECURITY DEFINER` which means it runs with the privileges of the function creator (typically the database owner). This is necessary to join the `auth.users` table which is not directly accessible to application users. The function is safe because:

1. It only returns email addresses (no passwords or sensitive data)
2. It only performs a lookup, no modifications
3. It's granted to both authenticated and anonymous users (needed for sign-in)
