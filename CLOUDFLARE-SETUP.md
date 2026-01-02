# Cloudflare Pages Configuration for Clerk Middleware

## The Issue

You're getting this error:
```
Error: No such module "__next-on-pages-dist__/functions/src/async_hooks"
```

This is because Clerk's middleware uses Node.js `async_hooks` API which requires specific Cloudflare compatibility flags that must be configured in the Cloudflare Pages dashboard.

## Solution: Configure Compatibility Flags in Cloudflare Pages

###Step 1: Go to Your Cloudflare Pages Project Settings

1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages**
3. Select your **Nexus Med News** project
4. Click on **Settings**
5. Scroll down to **Functions**

### Step 2: Add Compatibility Flags

Under **Compatibility flags**, add these two flags:

```
nodejs_compat
nodejs_als
```

**How to add them:**
- Click "Add compatibility flag"
- Type `nodejs_compat` and add it
- Click "Add compatibility flag" again
- Type `nodejs_als` and add it
- Click **Save**

### Step 3: Add Compatibility Date

Set the **Compatibility date** to: `2024-09-02`

### Step 4: Redeploy

After saving the settings:
1. Go to **Deployments** tab
2. Click **"Retry deployment"** on the latest failed deployment

OR

Simply push a new commit to trigger a fresh deployment

## What These Flags Do

- `nodejs_compat`: Enables Node.js compatibility mode in Cloudflare Workers
- `nodejs_als`: Enables Async Local Storage (required for Clerk's async_hooks usage)

## Alternative: If Compatibility Flags Don't Work

If the above doesn't work, you have two options:

### Option 1: Remove Clerk Authentication (Temporary)

Comment out the middleware temporarily to get the site deployed:

In `web/src/middleware.ts`:
```typescript
// Temporarily disabled for Cloudflare compatibility
export function middleware() {
  // No-op middleware
}

export const config = {
  matcher: ["/((?!.*\\.|_next).*)"],
};
```

### Option 2: Use Clerk's Manual Mode

Update middleware to use manual authentication checking instead of automatic middleware.

Let me know which approach you want to take!
