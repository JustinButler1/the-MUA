# Email Confirmation Setup

## What Changed

The app now supports Supabase email confirmation. Users must confirm their email address before they can sign in.

## Changes Made

### 1. Sign-Up Screen (`app/(auth)/sign-up.tsx`)

- Displays a success message after registration
- Shows "Resend confirmation email" button
- Clearer messaging that users need to confirm email before signing in

### 2. Sign-In Screen (`app/(auth)/sign-in.tsx`)

- Detects when users try to sign in with unconfirmed emails
- Shows helpful error message
- Provides "Resend confirmation email" button when needed
- Displays success message after resending

### 3. Auth Context (`contexts/AuthContext.tsx`)

- Added `resendConfirmationEmail()` function
- Uses Supabase's `auth.resend()` API

## Supabase Configuration Required

### Email Templates (Optional but Recommended)

Go to **Authentication > Email Templates** in Supabase Dashboard and customize:

1. **Confirm signup** template - sent when users register
2. Add your app's branding and messaging

### Redirect URLs (Important)

Go to **Authentication > URL Configuration** in Supabase Dashboard:

1. **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
2. **Redirect URLs**: Add these URLs:
   - `themua://` (for mobile app deep linking)
   - `exp://localhost:8081` (for Expo development)
   - `https://yourdomain.com` (for web, if applicable)

### Deep Linking Setup

The app scheme is already configured as `themua` in `app.json`.

When users click the confirmation link in their email:

- On mobile: Opens the app via `themua://` deep link
- On web: Can redirect to your web app

### Testing

1. **Development**:

   - Make sure your local Expo server is running
   - Click confirmation link from email
   - It should open your app

2. **Production**:
   - Test on TestFlight/Play Store builds
   - Ensure deep linking works correctly

## User Flow

1. User signs up with email, password, and username
2. Success message appears: "Account created! Please check your email..."
3. User receives confirmation email from Supabase
4. User clicks link in email (opens app via deep link)
5. User returns to app and signs in
6. If user tries to sign in before confirming:
   - Error message appears
   - "Resend confirmation email" button is available

## Security Notes

- Email confirmation is now **required** for all new users
- Users cannot sign in until their email is verified
- This prevents fake accounts and ensures email validity
- Users can resend confirmation emails if needed
