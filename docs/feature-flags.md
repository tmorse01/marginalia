# Feature Flags

This project supports feature flags through two methods:

## 1. Build-Time Flags (Vite Environment Variables)

**Simple, but requires rebuild to change**

Set in `.env` file or Netlify environment variables:
```bash
VITE_ENABLE_INLINE_EDITOR=true
```

**Pros:**
- Simple to set up
- Works immediately
- No database setup needed

**Cons:**
- Requires rebuild and redeploy to change
- Same value for all users
- Can't toggle per environment easily

## 2. Runtime Flags (Convex Database)

**Dynamic, can be toggled without rebuild**

Feature flags are stored in the `featureFlags` Convex table and can be toggled at runtime.

### Setup

1. **Initialize the flag in Convex Dashboard**:
   - Go to your Convex dashboard
   - Navigate to the `featureFlags` table
   - Insert a new document:
     ```json
     {
       "key": "inline_editor",
       "value": false,
       "description": "Enable the inline Obsidian-style markdown editor",
       "updatedAt": 1234567890
     }
     ```

2. **Or use the Convex mutation** (from dashboard Functions tab):
   ```javascript
   await ctx.runMutation(api.featureFlags.set, {
     key: "inline_editor",
     value: false,
     description: "Enable the inline Obsidian-style markdown editor"
   });
   ```

### Usage in Code

The `useInlineEditorFlag()` hook automatically:
- Checks Convex for the flag value (runtime)
- Falls back to `VITE_ENABLE_INLINE_EDITOR` env var if Convex is unavailable
- Updates in real-time when the flag changes in Convex

```typescript
import { useInlineEditorFlag } from '../lib/feature-flags'

function MyComponent() {
  const enableInlineEditor = useInlineEditorFlag()
  
  if (enableInlineEditor) {
    // Use inline editor
  } else {
    // Use textarea
  }
}
```

### Toggling Flags

**Via Convex Dashboard:**
1. Go to your Convex dashboard
2. Navigate to `featureFlags` table
3. Find the flag you want to change
4. Edit the `value` field (true/false)
5. Save - changes take effect immediately (no rebuild needed!)

**Via API/Mutation:**
```typescript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function AdminPanel() {
  const setFlag = useMutation(api.featureFlags.set);
  
  const toggleInlineEditor = () => {
    setFlag({
      key: "inline_editor",
      value: true, // or false
    });
  };
}
```

## Priority

**Convex flags override environment variables:**
1. First, check Convex for the flag value
2. If Convex query is loading/failed, fall back to `VITE_ENABLE_INLINE_EDITOR` env var
3. If neither is set, default to `false`

## Available Flags

| Flag Key | Description | Default |
|----------|-------------|---------|
| `inline_editor` | Enable the inline Obsidian-style markdown editor with syntax markers | `false` |

## Netlify Integration

You can set environment variables in Netlify:
- **Dashboard**: Site settings → Build & deploy → Environment variables
- **Contexts**: Set different values for production, branch deploys, deploy previews
- **Scopes**: Control where variables are available (builds, functions, runtime)

Example Netlify env var:
- **Key**: `VITE_ENABLE_INLINE_EDITOR`
- **Value**: `true` (for production) or `false` (for previews)
- **Context**: Production, Deploy previews, Branch deploys

## Convex vs Environment Variables

| Feature | Convex Flags | Env Vars |
|---------|--------------|----------|
| Runtime toggle | ✅ Yes | ❌ No (requires rebuild) |
| Per-user flags | ✅ Possible | ❌ No |
| Real-time updates | ✅ Yes | ❌ No |
| Setup complexity | Medium | Low |
| No rebuild needed | ✅ Yes | ❌ No |
| Works offline | ❌ No | ✅ Yes |

## Recommendation

- **For development/testing**: Use Convex flags for easy toggling
- **For production defaults**: Set env vars in Netlify as fallback
- **For user-specific features**: Use Convex flags with user targeting (future enhancement)
