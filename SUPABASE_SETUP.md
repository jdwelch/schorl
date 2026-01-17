# Supabase Setup Guide

## 1. Run Database Migrations

```bash
npm run setup:db
```

Copy the SQL output and run it in your Supabase dashboard at:
**SQL Editor → New Query → Paste and Run**

## 2. Configure Authentication

### Add Redirect URLs

Go to: **Authentication → URL Configuration**

Add these URLs to **Redirect URLs**:

**For Web (localhost development):**
```
http://localhost:8081/auth/callback
```

**For Web (production - when deployed):**
```
https://yourdomain.com/auth/callback
```
(Replace `yourdomain.com` with your actual domain)

**For Mobile:**
```
mdtasks://auth/callback
```

**⚠️ Important:** You need to add **BOTH** web and mobile URLs, even if you're only testing one platform. Supabase will use the correct one based on which platform requested the magic link.

### How Auth Flow Works (Different for Web vs Mobile)

**Web Flow:**
1. User enters email → Supabase sends magic link
2. Link format: `http://localhost:8081/auth/callback#access_token=...`
3. Browser opens the link → hits `app/auth/callback.tsx` route
4. Callback route processes tokens → Supabase creates session
5. Route redirects to main screen → user is authenticated ✅

**Mobile Flow:**
1. User enters email → Supabase sends magic link
2. Link format: `mdtasks://auth/callback?token=...`
3. User clicks link in email app → iOS/Android opens your app via deep link
4. `AuthContext` deep link listener catches the URL (never hits callback.tsx route!)
5. Supabase auto-exchanges token → session created
6. `onAuthStateChange` fires → user is authenticated ✅

**Key difference:** On web, the callback route processes the tokens. On mobile, the deep link listener in `AuthContext` handles it before any routing happens.

### Email Templates (Optional)

Go to: **Authentication → Email Templates → Magic Link**

Make sure the magic link template includes a button/link to your redirect URL.

## 3. Test the Flow

### Web Testing (Easiest to test first):
1. Start dev server: `npm run web`
2. Open browser to `http://localhost:8081`
3. Wait 2 seconds for auth banner to appear at bottom
4. Enter your email
5. Check email for magic link
6. Click link → should redirect to `http://localhost:8081/auth/callback`
7. Brief loading screen, then auto-redirect back to main screen
8. ✅ You should see:
   - Auth banner is gone
   - Sync indicator in toolbar (left of mode toggle) shows "Synced just now"
   - Your tasks are now syncing to Supabase

### Mobile Testing (iOS):
1. Start dev server: `npm run ios`
2. Wait 2 seconds for auth banner to appear
3. Enter your email
4. Check email on your device
5. **Important:** The magic link will try to open the app via deep link `mdtasks://`
   - In development, this might open the browser first
   - If it does, copy the URL and paste it in Notes/Messages, then tap it
   - This is a limitation of iOS development - production builds work better
6. ✅ App should open and you're authenticated

**Pro tip for mobile testing:** Use the same email for both platforms. Your tasks will sync between web and mobile!

### Mobile Testing with Expo Go (Dev Bypass)

Since magic links don't work in Expo Go, use this workaround:

1. **Sign in on web first:**
   - `npm run web`
   - Enter your email and complete magic link flow
   - Open browser console (F12)
   - Look for: `🔑 Dev auth token:`
   - Copy the long token string after the colon

2. **Use token on mobile:**
   - Open app in Expo Go
   - When auth banner appears, look for: **"Dev: Bypass auth"** button at bottom
   - Tap it
   - Paste the token you copied from web
   - Tap "Apply Token"
   - ✅ You're now signed in with the same account!

3. **Test multi-device sync:**
   - Add a task on web → should appear on mobile
   - Add a task on mobile → should appear on web
   - Check/uncheck tasks → syncs between devices

**Note:** This bypass only appears in development mode (`__DEV__`) and won't be in production builds.

## Troubleshooting

### "Unmatched Route" error (Web only)
**Symptom:** Click magic link → see "Unmatched Route" page

**Fix:**
- Make sure you've added the redirect URLs in Supabase dashboard
- Check that `app/auth/callback.tsx` exists
- Verify the URL in the magic link email matches what you added to Supabase

### Magic link doesn't work (Both platforms)
**Symptoms:** Click link → nothing happens or error

**Fixes:**
- Check spam folder for the email
- Verify email templates in Supabase → Authentication → Email Templates
- Make sure redirect URL matches exactly (including http/https)
- Check that you added the correct URL for your platform:
  - Web: `http://localhost:8081/auth/callback`
  - Mobile: `mdtasks://auth/callback`

### Session not persisting (Web only)
**Symptom:** Sign in works but refresh loses session

**Fixes:**
- Check browser console for errors
- Verify AsyncStorage is working (check Application → Local Storage in dev tools)
- Look for `supabase-auth-token` key in storage

### Deep link not opening app (Mobile only)
**Symptom:** Click magic link → opens browser instead of app

**Fixes:**
- iOS: Universal links may need the app to be installed from TestFlight or App Store
- Development: Deep links work differently - try copying the URL and pasting in Notes app, then tap it
- Make sure you've added `mdtasks://auth/callback` to Supabase redirect URLs
- Check that `scheme: "mdtasks"` is in app.json
- For Expo Go: Deep links won't work - need development build or bare workflow

### "Cannot find name 'window'" or SSR errors
**Symptom:** Build fails with window/AsyncStorage errors

**Fix:**
- This is fixed by the SSR guards we added
- Make sure `typeof window !== 'undefined'` checks are in place
- Verify `src/lib/supabase.ts` has the SSR detection code
