# CRITICAL: Supabase Redirect URL Configuration

## The Problem

You're seeing a "localhost" error after Google authentication because Supabase doesn't know that `themua://` is a valid redirect URL for your app.

## The Solution

You need to add your custom URL scheme to Supabase's allowed redirect URLs.

### Steps:

1. **Go to your Supabase Dashboard**

   - URL: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**

   - Click **Authentication** in the left sidebar
   - Click **URL Configuration** (or **Settings** depending on your dashboard version)

3. **Add Redirect URL**

   - Find the section called **"Redirect URLs"** or **"Site URL"**
   - Add the following URL:
     ```
     themua://*
     ```
   - Click **Save**

4. **Alternative: More Specific Redirect**
   You can also try:
   ```
   themua://
   ```
   or
   ```
   themua://oauth/callback
   ```

### Important Notes:

- The wildcard `themua://*` allows any path under your custom scheme
- This tells Supabase that it's safe to redirect to your app's URL scheme
- Without this configuration, Supabase defaults to `localhost` or the web callback URL

### After Configuration:

1. Save the settings in Supabase
2. Close and restart your app
3. Try the Google sign-in again

The flow should now work:

1. Click "Continue with Google"
2. Authenticate with Google
3. Google redirects to Supabase
4. **Supabase redirects to `themua://` with auth tokens** ✅
5. Your app catches the redirect and signs you in

### Screenshots Location:

In the Supabase Dashboard, look for:

- **Project Settings > Authentication > URL Configuration**
- Or: **Authentication > Settings > Redirect URLs**

The exact location depends on your Supabase dashboard version, but it's always under Authentication settings.
