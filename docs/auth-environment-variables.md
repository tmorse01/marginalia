# Auth Environment Variables: Dev vs Production

## Overview

Convex Auth requires URLs configured in two places:

### Frontend Environment Variables (Vite/Build-time)

Set these in your `.env.local` file or deployment platform (Netlify, Vercel, etc.):

1. **`VITE_CONVEX_URL`** (Required) - Your Convex deployment URL for the main client
   - **Must end with `.convex.cloud`** (not `.convex.site`)
   - Used by `ConvexReactClient` for queries, mutations, and subscriptions
   - Example: `https://your-project.convex.cloud`

2. **`VITE_CONVEX_AUTH_URL`** (Optional) - Your Convex HTTP Actions URL for OAuth redirects
   - **Must end with `.convex.site`** (HTTP Actions endpoint)
   - Used for OAuth sign-in redirects and auth callbacks
   - Example: `https://your-project.convex.site`
   - **Note**: If not set, falls back to `VITE_CONVEX_URL` (but they're typically different)

### Backend Environment Variables (Convex)

Set these in Convex Dashboard or via CLI (`npx convex env set`):

1. **`SITE_URL`** - Your Convex HTTP Actions URL (where OAuth callbacks go)
   - Usually the same for dev and prod (your Convex HTTP Actions URL)
   - Example: `https://useful-vole-535.convex.site`
   - **Note**: This should match `VITE_CONVEX_AUTH_URL` on the frontend

2. **`ALLOWED_DEV_URLS`** (Optional) - Allowed redirect URLs for frontend environments
   - Comma-separated list of URLs that should be allowed for redirects
   - Example: `http://localhost:3000,https://dev-marginalia.netlify.app,https://marginalia.netlify.app`
   - Useful when you want to support multiple environments (localhost, dev, prod)
   - **Note**: `localhost` is automatically allowed, but you can add it here for clarity

## Convex Deployments

Convex supports separate deployments:
- **Development** - Created when you run `npx convex dev`
- **Production** - Created when you run `npx convex deploy --prod`

Each deployment has its own environment variables.

## Setting Frontend Environment Variables

### Local Development (`.env.local`)

Create a `.env.local` file in your project root:

```bash
# Required: Convex deployment URL (.convex.cloud)
VITE_CONVEX_URL=https://your-project.convex.cloud

# Optional: HTTP Actions URL (.convex.site) - for OAuth redirects
# If not set, falls back to VITE_CONVEX_URL
VITE_CONVEX_AUTH_URL=https://your-project.convex.site
```

**Important**: 
- `VITE_CONVEX_URL` must end with `.convex.cloud` (for the main Convex client)
- `VITE_CONVEX_AUTH_URL` should end with `.convex.site` (for HTTP Actions/OAuth)
- These are typically different URLs!

### Deployment Platforms (Netlify, Vercel, etc.)

Set these in your deployment platform's environment variables:

1. **Netlify**: Site settings → Build & deploy → Environment variables
2. **Vercel**: Project settings → Environment Variables

Add:
- `VITE_CONVEX_URL` = `https://your-project.convex.cloud`
- `VITE_CONVEX_AUTH_URL` = `https://your-project.convex.site` (optional)

## Setting Backend Environment Variables Per Deployment

### Method 1: Using Convex CLI (Recommended)

#### For Development Deployment

```bash
# Make sure you're using the dev deployment
# (This happens automatically when you run `npx convex dev`)

# Set SITE_URL (usually same for both)
npx convex env set SITE_URL "https://useful-vole-535.convex.site"

# Optional: Allow multiple frontend URLs (localhost is automatically allowed)
# This allows redirects to localhost, deployed dev, and production
npx convex env set ALLOWED_DEV_URLS "http://localhost:3000,https://dev-marginalia.netlify.app,https://marginalia.netlify.app"

# Set OAuth credentials (can be same or different for dev/prod)
npx convex env set AUTH_GITHUB_ID "your-dev-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-dev-github-secret"
```

#### For Production Deployment

```bash
# Switch to production deployment
# Option 1: Use production deploy key
export CONVEX_DEPLOY_KEY="your-production-deploy-key"
npx convex deploy --prod

# Option 2: Use --prod flag with env commands
npx convex env set --prod SITE_URL "https://useful-vole-535.convex.site"
npx convex env set --prod ALLOWED_DEV_URLS "https://your-app.netlify.app"

# Set production OAuth credentials
npx convex env set --prod AUTH_GITHUB_ID "your-prod-github-client-id"
npx convex env set --prod AUTH_GITHUB_SECRET "your-prod-github-secret"
```

### Method 2: Using Convex Dashboard

1. **Go to Convex Dashboard**: https://dashboard.convex.dev
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Select the deployment** (Development or Production) from the dropdown
5. **Add/Edit variables**:
   - `SITE_URL`: Your Convex HTTP Actions URL
   - `ALLOWED_DEV_URLS`: Comma-separated list of allowed frontend URLs (optional)
   - `AUTH_GITHUB_ID`: GitHub OAuth Client ID
   - `AUTH_GITHUB_SECRET`: GitHub OAuth Client Secret

## Quick Setup Script

Create a script to set up both environments:

```bash
#!/bin/bash
# setup-auth-env.sh

# Get your Convex deployment name (replace with yours)
CONVEX_SITE_URL="https://useful-vole-535.convex.site"

# Development
echo "Setting up DEV environment..."
npx convex env set SITE_URL "$CONVEX_SITE_URL"
npx convex env set ALLOWED_DEV_URLS "http://localhost:3000,https://dev-marginalia.netlify.app"
npx convex env set AUTH_GITHUB_ID "your-dev-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-dev-github-secret"

# Production (requires production deploy key)
echo "Setting up PROD environment..."
export CONVEX_DEPLOY_KEY="your-production-deploy-key"
npx convex env set --prod SITE_URL "$CONVEX_SITE_URL"
npx convex env set --prod ALLOWED_DEV_URLS "https://your-app.netlify.app"
npx convex env set --prod AUTH_GITHUB_ID "your-prod-github-client-id"
npx convex env set --prod AUTH_GITHUB_SECRET "your-prod-github-secret"
```

## Checking Current Values

```bash
# List all environment variables for current deployment
npx convex env ls

# List for specific deployment
npx convex env ls --prod
```

## Important Notes

### SITE_URL
- **Should be the same** for dev and prod (your Convex HTTP Actions URL)
- This is where OAuth providers redirect after authorization
- Format: `https://your-deployment-name.convex.site`

### ALLOWED_DEV_URLS (Optional)
- **Comma-separated list** of frontend URLs allowed for redirects
- Useful when you want to support **multiple environments** (localhost, dev, prod)
- Example: `http://localhost:3000,https://dev-marginalia.netlify.app,https://marginalia.netlify.app`
- The custom `redirect` callback in `convex/auth.ts` validates these URLs
- **Note**: `localhost` (any port) is automatically allowed, but you can add it here for clarity
- If not set, only `localhost` and `SITE_URL` are allowed

### OAuth Provider Configuration

You'll need **separate OAuth apps** for dev and prod, or configure your OAuth app with multiple callback URLs:

**GitHub OAuth App:**
- **Authorization callback URL**: 
  - `https://useful-vole-535.convex.site/api/auth/callback/github` (works for both dev/prod)
  - Or create separate apps for dev/prod

**Google OAuth:**
- **Authorized redirect URIs**:
  - `https://useful-vole-535.convex.site/api/auth/callback/google`
  - Can add multiple URIs for different environments

## Troubleshooting

### Issue: "Invalid deployment address: ends with .convex.site"
- **Cause**: `VITE_CONVEX_URL` is set to a `.convex.site` URL
- **Fix**: Set `VITE_CONVEX_URL` to your `.convex.cloud` URL
- **Note**: Use `VITE_CONVEX_AUTH_URL` for the `.convex.site` URL

### Issue: Redirect goes to wrong URL
- **Check**: `ALLOWED_DEV_URLS` includes the URL you're trying to redirect to
- **Verify**: Run `npx convex env ls` to see current values
- **Note**: `localhost` is automatically allowed, so you don't need to add it unless you want to be explicit

### Issue: OAuth callback fails
- **Check**: `SITE_URL` matches your Convex HTTP Actions URL
- **Verify**: OAuth provider callback URL matches `SITE_URL/api/auth/callback/[provider]`

### Issue: Environment variables not updating
- **Check**: You're setting variables for the correct deployment
- **Verify**: Restart `npx convex dev` after changing dev variables
- **Verify**: Redeploy production after changing prod variables

## Example Configuration

### Development (Supporting Both Localhost and Deployed Dev)
```bash
SITE_URL=https://useful-vole-535.convex.site
ALLOWED_DEV_URLS=http://localhost:3000,https://dev-marginalia.netlify.app
AUTH_GITHUB_ID=dev_client_id_123
AUTH_GITHUB_SECRET=dev_secret_abc
```

**Note**: With `ALLOWED_DEV_URLS` set, you can log in from:
- `http://localhost:3000` (local development - also automatically allowed)
- `https://dev-marginalia.netlify.app` (deployed dev environment)

### Production
```bash
SITE_URL=https://useful-vole-535.convex.site
ALLOWED_DEV_URLS=https://marginalia.netlify.app
AUTH_GITHUB_ID=prod_client_id_456
AUTH_GITHUB_SECRET=prod_secret_xyz
```
