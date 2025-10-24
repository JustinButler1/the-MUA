# Google OAuth Setup Guide

This guide walks you through setting up Google sign-in/sign-up for your React Native app using Supabase OAuth.

## Prerequisites

- Your app details:
  - **iOS Bundle ID**: `com.justinbutler1.theMUA`
  - **Android Package**: `com.justinbutler1.theMUA`
  - **URL Scheme**: `themua`

## Part 1: Google Cloud Console Setup

### Step 1: Create/Access Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Either:
   - Create a new project, OR
   - Select an existing project from the dropdown at the top

### Step 2: Enable Google+ API (if required)

1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and click **Enable** (if not already enabled)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace)
3. Click **Create**
4. Fill in the required information:
   - **App name**: the-MUA (or your preferred name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **Save and Continue**
6. On the Scopes page, click **Save and Continue** (default scopes are fine)
7. Add test users if needed (during development)
8. Click **Save and Continue**, then **Back to Dashboard**

### Step 4: Create OAuth Client IDs

You need to create **three** OAuth client IDs: one for iOS, one for Android, and one for Web (Supabase).

#### 4.1: iOS OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **iOS** as the application type
4. Fill in:
   - **Name**: the-MUA iOS
   - **Bundle ID**: `com.justinbutler1.theMUA`
5. Click **Create**
6. **Save the Client ID** that appears (you'll need it later)

#### 4.2: Android OAuth Client ID

1. Click **Create Credentials** > **OAuth client ID** again
2. Select **Android** as the application type
3. Fill in:
   - **Name**: the-MUA Android
   - **Package name**: `com.justinbutler1.theMUA`
   - **SHA-1 certificate fingerprint**: You need to get this from your keystore

**To get your SHA-1 fingerprint:**

For debug builds:

```bash
cd android
./gradlew signingReport
```

Look for the SHA-1 under `Variant: debug` > `Config: debug`. It will look like:

```
SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
```

For production builds, you'll need to use your release keystore.

4. Click **Create**
5. **Save the Client ID** that appears

#### 4.3: Web OAuth Client ID (for Supabase)

1. Click **Create Credentials** > **OAuth client ID** again
2. Select **Web application** as the application type
3. Fill in:
   - **Name**: the-MUA Web (Supabase)
4. Under **Authorized redirect URIs**, you'll add your Supabase callback URL:
   - Format: `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
   - You can find your project ref in your Supabase project URL
5. Click **Create**
6. **Save both the Client ID and Client Secret** that appear

### Step 5: Note Down All Credentials

You should now have:

- ✅ iOS Client ID
- ✅ Android Client ID
- ✅ Web Client ID
- ✅ Web Client Secret

## Part 2: Supabase Configuration

### Step 1: Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** in the list and click on it

### Step 2: Configure Google Provider

1. Toggle **Enable Sign in with Google** to ON
2. Fill in the credentials from Google Cloud Console:
   - **Client ID**: Use the **Web Client ID** from Step 4.3
   - **Client Secret**: Use the **Web Client Secret** from Step 4.3
3. Under **Authorized Client IDs**, add both mobile client IDs:
   - Add your **iOS Client ID** (from Step 4.1)
   - Add your **Android Client ID** (from Step 4.2)
4. Click **Save**

### Step 3: Note Your Redirect URL

Supabase provides a redirect URL in the format:

```
https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
```

Make sure this matches the redirect URI you added in Google Cloud Console (Step 4.3).

## Part 3: Update App Configuration (if needed)

### iOS Configuration

If you need to add custom URL scheme handling, add this to your `ios/theMUA/Info.plist` (already configured):

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>themua</string>
      <string>com.justinbutler1.theMUA</string>
    </array>
  </dict>
</array>
```

### Android Configuration

The package name is already set in `android/app/build.gradle`:

```gradle
applicationId 'com.justinbutler1.theMUA'
```

## Part 4: Testing

### Test the OAuth Flow

1. Start your app:

   ```bash
   npm start
   ```

2. Run on your device/simulator:

   ```bash
   # For iOS
   npm run ios

   # For Android
   npm run android
   ```

3. Navigate to the Sign In or Sign Up screen
4. Click the **"Continue with Google"** button
5. You should see:
   - A browser window opens with Google sign-in
   - You can select your Google account
   - After authorization, you're redirected back to the app
   - You're signed in!

### Troubleshooting

#### "Safari can't open the page - localhost error" (FIXED)

- **Issue**: OAuth redirect was trying to use `localhost`, which doesn't work on mobile devices
- **Solution**: The code now uses `skipBrowserRedirect: true` and manually handles the callback
- The implementation extracts tokens from the callback URL and sets the session directly
- Your app uses the custom scheme `themua://` for proper mobile redirects

#### "redirect_uri_mismatch" Error

- Make sure the redirect URI in Google Cloud Console matches your Supabase callback URL exactly
- Check that you've added it under **Authorized redirect URIs** in the Web OAuth client

#### "invalid_client" Error

- Verify that the Client ID and Client Secret in Supabase match the Web OAuth client from Google Cloud Console
- Make sure you've added the iOS and Android Client IDs to the "Authorized Client IDs" in Supabase

#### App Not Redirecting Back

- Check that your URL scheme (`themua`) is properly configured in Info.plist (iOS) and app.json
- Make sure `expo-web-browser` is properly installed

#### OAuth Popup Closes Immediately

- Check the console logs for detailed error messages (we've added comprehensive logging)
- Look for messages like "Opening OAuth URL", "OAuth result", "OAuth callback URL received"
- Verify your Supabase URL and API key are correct in your environment variables

#### "No access token received" Error

- This means the OAuth callback didn't include authentication tokens
- **Most common cause**: iOS/Android Client IDs not added to Supabase's "Authorized Client IDs"
- Verify in Supabase Dashboard: Authentication > Providers > Google > Authorized Client IDs
- Make sure you've added BOTH the iOS and Android Client IDs (not the Web one)

#### User Creation Issues

- Check your Supabase database triggers (you have auto-profile creation set up)
- Look at Supabase logs: Authentication > Logs
- The user profile should be auto-created after successful Google sign-in

#### Debugging Tips

- **Enable detailed console logging**: Check your Metro bundler terminal for messages
- Look for these log messages in order:
  1. "Opening OAuth URL..." - OAuth flow started
  2. "OAuth result: {type: 'success'}" - Browser returned successfully
  3. "OAuth callback URL received" - Callback was parsed
  4. "Setting session with tokens..." - Session is being created
  5. "Google sign-in successful!" - All done!
- If you see an error at any step, that tells you where the issue is

## Part 5: Production Considerations

### Before Publishing

1. **Update OAuth Consent Screen** to "Published" status in Google Cloud Console
2. **Add Production SHA-1** fingerprints to Android OAuth client
3. **Test on physical devices** (both iOS and Android)
4. **Update Privacy Policy** to mention Google sign-in
5. **Add proper error handling** for network issues

### Security

- Never commit your Google Client Secret to version control
- Store all sensitive credentials in environment variables
- Consider adding rate limiting to prevent abuse
- Monitor authentication logs in Supabase

## Code Summary

The following files have been updated with Google OAuth support:

1. **lib/supabase.ts** - Added OAuth redirect handling
2. **contexts/AuthContext.tsx** - Added `signInWithGoogle()` method
3. **app/(auth)/sign-in.tsx** - Added Google sign-in button
4. **app/(auth)/sign-up.tsx** - Added Google sign-up button

### Key Features

- ✅ One-tap Google sign-in/sign-up
- ✅ Seamless OAuth flow using system browser
- ✅ Automatic session management
- ✅ Works on iOS and Android
- ✅ Consistent UI with existing auth screens
- ✅ Loading states and error handling

## Support

If you encounter issues:

1. Check Supabase logs: Authentication > Logs
2. Check Google Cloud Console: APIs & Services > Credentials > OAuth 2.0 Client IDs
3. Review React Native logs for detailed error messages
4. Verify all credentials are correctly entered

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Setup](https://support.google.com/cloud/answer/6158849)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
