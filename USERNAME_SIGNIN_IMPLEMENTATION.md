# Username Sign-In Implementation

This document describes the implementation of username-based sign-in functionality, allowing users to sign in with either their email or username using the same input field.

## Changes Made

### 1. Database Migration (`db/migrations/008_username_to_email_lookup.sql`)

Created a new PostgreSQL function `get_email_from_username()`:

- **Purpose**: Looks up a user's email address from their username
- **Security**: Uses `SECURITY DEFINER` to safely access the `auth.users` table
- **Case-insensitive**: Matches usernames regardless of case
- **Permissions**: Available to both authenticated and anonymous users (required for sign-in)

### 2. Authentication Context (`contexts/AuthContext.tsx`)

Updated the `signIn()` function:

- **Parameter renamed**: `email` → `emailOrUsername` for clarity
- **Smart detection**: Checks if input contains `@` to determine if it's an email or username
- **Username lookup**: If username is detected, calls the `get_email_from_username()` RPC function
- **Error handling**: Returns user-friendly error messages for invalid credentials
- **Fallback**: Uses the resolved email for authentication with Supabase

### 3. Sign-In Screen (`app/(auth)/sign-in.tsx`)

Updated the UI to reflect the new functionality:

- **Label changed**: "Email" → "Email or Username"
- **Placeholder updated**: "you@example.com" → "you@example.com or username"
- **State variable renamed**: `email` → `emailOrUsername` for code clarity
- **Keyboard type**: Changed from `email-address` to `default` for better username entry

### 4. Documentation

Created:

- `db/migrations/README_USERNAME_SIGNIN.md` - Migration instructions and testing guide
- `USERNAME_SIGNIN_IMPLEMENTATION.md` - This file

## How It Works

1. **User enters credentials**: Types either `user@example.com` or `myusername` in the sign-in field
2. **Detection logic**: The app checks if the input contains an `@` character
   - If **yes** → treats it as an email, proceeds directly to authentication
   - If **no** → treats it as a username, looks up the associated email
3. **Username lookup** (if needed): Calls the database function to find the email
4. **Authentication**: Signs in with the email using Supabase's standard password authentication

## Example Flow

### Scenario 1: Sign in with email

```
Input: "john@example.com"
       ↓
Detects '@' character
       ↓
signInWithPassword(email: "john@example.com", password)
```

### Scenario 2: Sign in with username

```
Input: "john123"
       ↓
No '@' detected, it's a username
       ↓
Call: get_email_from_username("john123")
       ↓
Returns: "john@example.com"
       ↓
signInWithPassword(email: "john@example.com", password)
```

## Next Steps

To enable this feature, you need to:

1. **Apply the database migration**:

   - Go to your Supabase dashboard → SQL Editor
   - Copy the contents of `db/migrations/008_username_to_email_lookup.sql`
   - Execute it

2. **Test the feature**:
   - Try signing in with an existing username
   - Try signing in with an email
   - Verify both methods work correctly

## Security Considerations

- The database function only returns email addresses (no passwords or sensitive data)
- Username lookups are case-insensitive to improve UX
- The function uses `SECURITY DEFINER` safely as it only performs reads
- Failed lookups return the same generic error as failed sign-ins to prevent username enumeration

## Testing

### Manual Testing

1. Sign in with a valid email → Should work
2. Sign in with a valid username → Should work
3. Sign in with invalid email → Should show error
4. Sign in with invalid username → Should show error
5. Sign in with wrong password (valid email) → Should show error
6. Sign in with wrong password (valid username) → Should show error

### SQL Testing

```sql
-- Test the lookup function
SELECT get_email_from_username('your_username');
-- Should return: your_email@example.com

-- Test case-insensitivity
SELECT get_email_from_username('YOUR_USERNAME');
-- Should return the same email
```

## Benefits

- **Better UX**: Users can sign in with what they remember (username or email)
- **Single input field**: Clean, simple interface
- **Backwards compatible**: Existing email-based sign-ins continue to work
- **Consistent with modern apps**: Many apps support both email and username
