# Testing Convex Auth Setup

## ✅ Current Configuration

- ✅ `SITE_URL` set to: `https://useful-vole-535.convex.site`
- ✅ GitHub OAuth credentials configured
- ✅ Google OAuth credentials configured

## 🧪 Test Steps

### 1. Test HTTP Actions Directly

Open this URL in your browser:
```
https://useful-vole-535.convex.site/api/auth/signin/github
```

**Expected Result:** Should redirect you to GitHub's OAuth authorization page

**If you see an error:**
- Check that HTTP Actions are enabled in Convex Dashboard
- Check Convex Dashboard logs for errors

### 2. Test Sign-In from Your App

1. **Start your local dev server** (if not already running):
   ```bash
   pnpm dev
   ```

2. **Open your app** at `http://localhost:3000`

3. **Open browser console** (F12) and look for:
   - `[AUTH DEBUG] Convex URL configured: YES`
   - `[AUTH DEBUG] Auth state:` messages

4. **Click the "Sign In" button**

5. **Check console logs** - you should see:
   ```
   [AUTH DEBUG] ===== SIGN IN CLICKED =====
   [AUTH DEBUG] signIn function: [function]
   [AUTH DEBUG] Calling signIn("github")...
   [AUTH DEBUG] signIn returned: [result]
   ```

6. **Expected behavior:**
   - Should redirect to GitHub OAuth page
   - After authorizing, should redirect back to your app
   - Should be logged in

### 3. Verify GitHub OAuth App Configuration

Make sure your GitHub OAuth App has:
- **Authorization callback URL:** `https://useful-vole-535.convex.site`
- Or: `https://useful-vole-535.convex.site/api/auth/callback/github`

Check at: https://github.com/settings/developers

### 4. Check for Errors

If sign-in doesn't work, check:

**Browser Console:**
- Any red error messages
- `[AUTH DEBUG]` logs showing what happened

**Convex Dashboard:**
- Go to: https://dashboard.convex.dev → Your Project → Logs
- Look for errors related to auth

**Common Issues:**
1. **No redirect happens:** Check browser console for errors
2. **"Invalid client" error:** GitHub OAuth callback URL doesn't match
3. **Redirect loop:** Check `SITE_URL` is correct
4. **HTTP Actions error:** Make sure HTTP Actions are enabled

## 🎯 Next Steps After Successful Login

Once you successfully log in, you should see:
- `[AUTH DEBUG] Auth state:` showing `isAuthenticated: true`
- `[AUTH DEBUG] Creating/getting user from identity:` log
- `[AUTH DEBUG] User created/found:` log
- Your user ID in the logs
- Profile dropdown instead of sign-in button
