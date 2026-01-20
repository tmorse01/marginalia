# Convex Auth Setup Validation Checklist

## ✅ Code Configuration (Already Done)

### 1. Backend Configuration (`convex/auth.ts`)
- ✅ `convexAuth` imported from `@convex-dev/auth/server`
- ✅ GitHub provider configured
- ✅ Google provider configured (optional - can remove if not using)
- ✅ `getCurrentUserIdentity` query exists

### 2. HTTP Routes (`convex/http.ts`)
- ✅ `httpRouter` created
- ✅ `auth.addHttpRoutes(http)` called
- ✅ Router exported as default

### 3. Frontend Configuration (`src/routes/__root.tsx`)
- ✅ `ConvexAuthProvider` imported from `@convex-dev/auth/react`
- ✅ `ConvexAuthProvider` wraps the app with `client={convex}`
- ✅ Provider is at the root level (before other providers)

### 4. Client Setup (`src/lib/convex.ts`)
- ✅ `ConvexReactClient` created
- ✅ Uses `VITE_CONVEX_URL` from environment

---

## 🔍 Environment Variables to Check

### Required for Convex Backend (set in Convex Dashboard or via CLI)

Run these commands to check your Convex environment variables:

```bash
# Check if variables are set (replace with your deployment name)
npx convex env ls
```

**Required Variables:**
1. ✅ `AUTH_GITHUB_ID` - Your GitHub OAuth App Client ID
2. ✅ `AUTH_GITHUB_SECRET` - Your GitHub OAuth App Client Secret
3. ⚠️ `AUTH_GOOGLE_ID` - Your Google OAuth Client ID (only if using Google)
4. ⚠️ `AUTH_GOOGLE_SECRET` - Your Google OAuth Client Secret (only if using Google)
5. ✅ `SITE_URL` - Your Convex HTTP Actions URL (e.g., `https://useful-vole-535.convex.site`)

**To Set Variables:**
```bash
# Set GitHub credentials
npx convex env set AUTH_GITHUB_ID "your-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-github-client-secret"

# Set SITE_URL (CRITICAL for OAuth callbacks)
npx convex env set SITE_URL "https://useful-vole-535.convex.site"

# Optional: Set Google credentials
npx convex env set AUTH_GOOGLE_ID "your-google-client-id"
npx convex env set AUTH_GOOGLE_SECRET "your-google-client-secret"
```

### Required for Frontend (set in `.env.local` or deployment)

1. ✅ `VITE_CONVEX_URL` - Your Convex deployment URL (e.g., `https://useful-vole-535.convex.site`)

---

## 🔧 Convex Dashboard Configuration

### 1. HTTP Actions Enabled
- Go to: [Convex Dashboard](https://dashboard.convex.dev) → Your Project → Settings
- ✅ **HTTP Actions** must be **ENABLED**
- This is required for OAuth callbacks to work

### 2. Environment Variables
- Go to: Settings → Environment Variables
- ✅ Verify all required variables are set (see above)
- ✅ Check that `SITE_URL` matches your Convex HTTP Actions URL

---

## 🔐 OAuth Provider Configuration

### GitHub OAuth App Setup

1. **Create GitHub OAuth App:**
   - Go to: https://github.com/settings/developers
   - Click "New OAuth App"
   - **Application name:** Marginalia (or your app name)
   - **Homepage URL:** `http://localhost:3000` (for local) or your production URL
   - **Authorization callback URL:** 
     - For local: `http://localhost:3000` (Convex Auth handles the path)
     - For production: `https://useful-vole-535.convex.site` (your Convex HTTP Actions URL)
   - Click "Register application"
   - Copy the **Client ID** and generate a **Client Secret**

2. **Set in Convex:**
   ```bash
   npx convex env set AUTH_GITHUB_ID "your-client-id"
   npx convex env set AUTH_GITHUB_SECRET "your-client-secret"
   ```

### Google OAuth Setup (Optional)

1. **Create Google OAuth Credentials:**
   - Go to: https://console.cloud.google.com/
   - Create/select a project
   - Enable Google+ API or Google Identity API
   - Go to: APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - **Application type:** Web application
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (local)
     - Your production frontend URL
   - **Authorized redirect URIs:**
     - `https://useful-vole-535.convex.site/api/auth/callback/google`
     - `https://useful-vole-535.convex.site` (base URL)
   - Copy **Client ID** and **Client Secret**

2. **Set in Convex:**
   ```bash
   npx convex env set AUTH_GOOGLE_ID "your-client-id"
   npx convex env set AUTH_GOOGLE_SECRET "your-client-secret"
   ```

---

## 🧪 Testing Checklist

### 1. Verify Environment Variables
```bash
# Check Convex environment variables
npx convex env ls

# Should show:
# - AUTH_GITHUB_ID
# - AUTH_GITHUB_SECRET
# - SITE_URL
# - (Optional) AUTH_GOOGLE_ID
# - (Optional) AUTH_GOOGLE_SECRET
```

### 2. Test HTTP Actions
- Go to: `https://useful-vole-535.convex.site/api/auth/signin/github`
- Should redirect to GitHub OAuth (not show an error)

### 3. Test Sign-In Flow
1. Click "Sign In" button in your app
2. Should redirect to GitHub/Google OAuth page
3. After authorizing, should redirect back to your app
4. Should be logged in

### 4. Check Console Logs
- Look for `[AUTH DEBUG]` messages
- Should see auth state changes
- Should see user creation/fetching logs after successful login

---

## 🐛 Common Issues

### Issue: "This Convex deployment does not have HTTP actions enabled"
**Solution:** Enable HTTP Actions in Convex Dashboard → Settings

### Issue: "Missing environment variable `SITE_URL`"
**Solution:** Set `SITE_URL` to your Convex HTTP Actions URL:
```bash
npx convex env set SITE_URL "https://useful-vole-535.convex.site"
```

### Issue: Sign-in button does nothing
**Possible causes:**
1. HTTP Actions not enabled
2. `SITE_URL` not set
3. OAuth credentials not set
4. OAuth callback URL mismatch

### Issue: OAuth redirect fails
**Check:**
1. OAuth app callback URL matches your Convex HTTP Actions URL
2. `SITE_URL` environment variable is set correctly
3. HTTP Actions are enabled

### Issue: "Invalid client" or OAuth errors
**Check:**
1. OAuth Client ID and Secret are correct
2. OAuth app callback URL is configured correctly
3. Environment variables are set in Convex (not just locally)

---

## 📝 Quick Validation Script

Run this to check your setup:

```bash
# 1. Check Convex environment variables
echo "Checking Convex environment variables..."
npx convex env ls

# 2. Check HTTP Actions URL
echo "Your Convex HTTP Actions URL should be:"
echo "https://useful-vole-535.convex.site"
echo ""
echo "Test it by visiting:"
echo "https://useful-vole-535.convex.site/api/auth/signin/github"
echo ""
echo "If it redirects to GitHub, HTTP Actions are working!"
```

---

## ✅ Final Checklist

Before testing sign-in, verify:

- [ ] HTTP Actions enabled in Convex Dashboard
- [ ] `SITE_URL` environment variable set in Convex
- [ ] `AUTH_GITHUB_ID` set in Convex
- [ ] `AUTH_GITHUB_SECRET` set in Convex
- [ ] GitHub OAuth app created with correct callback URL
- [ ] `VITE_CONVEX_URL` set in frontend `.env.local`
- [ ] `ConvexAuthProvider` wraps your app
- [ ] `auth.addHttpRoutes(http)` called in `convex/http.ts`
- [ ] OAuth providers configured in `convex/auth.ts`

---

## 🎯 Next Steps

1. **Verify all environment variables are set** (use `npx convex env ls`)
2. **Test HTTP Actions** by visiting the sign-in URL directly
3. **Click sign-in button** in your app and watch console logs
4. **Check for errors** in both browser console and Convex Dashboard logs

If everything is configured correctly, clicking sign-in should redirect you to the OAuth provider!
