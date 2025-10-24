# Google OAuth Quick Reference

## Your App Information

```
iOS Bundle ID:     com.justinbutler1.theMUA
Android Package:   com.justinbutler1.theMUA
URL Scheme:        themua
```

## Google Cloud Console Checklist

### OAuth Client IDs to Create

- [ ] **iOS Client ID**
  - Type: iOS
  - Bundle ID: `com.justinbutler1.theMUA`
- [ ] **Android Client ID**
  - Type: Android
  - Package: `com.justinbutler1.theMUA`
  - SHA-1: Get from `cd android && ./gradlew signingReport`
- [ ] **Web Client ID** (for Supabase)
  - Type: Web application
  - Authorized redirect URI: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`

## Supabase Configuration Checklist

- [ ] Go to Authentication > Providers > Google
- [ ] Enable Google provider
- [ ] Enter Web Client ID
- [ ] Enter Web Client Secret
- [ ] Add iOS Client ID to "Authorized Client IDs"
- [ ] Add Android Client ID to "Authorized Client IDs"
- [ ] Click Save

## Get Your SHA-1 Fingerprint

```bash
cd android
./gradlew signingReport
```

Look for `SHA1:` under `Variant: debug` > `Config: debug`

## Testing Commands

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Common Errors & Fixes

| Error                           | Solution                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| Safari localhost error (FIXED!) | Code now uses `themua://` scheme, no longer tries localhost         |
| `redirect_uri_mismatch`         | Verify redirect URI in Google Console matches Supabase callback URL |
| `invalid_client`                | Check Client ID and Secret in Supabase match Web OAuth client       |
| App doesn't redirect back       | Verify URL scheme `themua` is in Info.plist and app.json            |
| `No access token received`      | Add iOS/Android Client IDs to Supabase "Authorized Client IDs"      |
| OAuth popup closes immediately  | Check console logs, verify Supabase credentials                     |

## Where to Find Things

### Google Cloud Console

```
https://console.cloud.google.com/
→ APIs & Services
  → Credentials
    → OAuth 2.0 Client IDs
```

### Supabase Dashboard

```
https://supabase.com/dashboard
→ [Your Project]
  → Authentication
    → Providers
      → Google
```

## Quick Test

1. Open your app
2. Go to Sign In screen
3. Click "Continue with Google"
4. Select Google account
5. Authorize
6. Should redirect back and sign you in!

### Console Logs to Watch For

When testing, look for these logs in your Metro bundler terminal:

```
✅ Opening OAuth URL...
✅ OAuth result: {type: 'success', ...}
✅ OAuth callback URL received
✅ Setting session with tokens...
✅ Google sign-in successful!
```

If you see an error at any step, that's where the issue is!

## Modified Files

- ✅ `lib/supabase.ts` - OAuth config
- ✅ `contexts/AuthContext.tsx` - signInWithGoogle method
- ✅ `app/(auth)/sign-in.tsx` - Google button
- ✅ `app/(auth)/sign-up.tsx` - Google button
- ✅ `package.json` - expo-auth-session installed
