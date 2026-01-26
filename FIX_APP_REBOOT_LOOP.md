# Fix: App Keeps Rebooting - Infinite Loop Issue

## Problem
The application was continuously rebooting/re-rendering due to an infinite loop in the `useEffect` hooks in `App.tsx`.

## Root Cause

The original `useEffect` had dependencies `[retryCount, backendStatus]`, which caused:

1. **Effect runs** → Calls `checkBackend()`
2. **If check fails** → Updates `retryCount` and `backendStatus`
3. **State changes** → Triggers effect to run again
4. **Effect runs again** → Calls `checkBackend()` again
5. **Infinite loop** → App keeps rebooting

Additionally:
- Multiple intervals were being created on every effect run
- Retry logic was mixed with periodic health checks
- No proper cleanup between effect runs

## Solution Applied

### 1. Separated Concerns into Three Effects

**Before:** One effect handling everything
```typescript
useEffect(() => {
  checkBackend();
  // retry logic
  // periodic check
}, [retryCount, backendStatus]); // ❌ Causes infinite loop
```

**After:** Three separate effects with proper dependencies
```typescript
// Effect 1: Initial check (runs once)
useEffect(() => {
  checkBackend();
}, [checkBackend]);

// Effect 2: Retry logic (only when retryCount changes)
useEffect(() => {
  if (retryCount > 0 && retryCount <= 5 && backendStatus === 'disconnected') {
    // schedule retry
  }
}, [retryCount, backendStatus, checkBackend]);

// Effect 3: Periodic check (only when connected)
useEffect(() => {
  if (backendStatus !== 'connected') return;
  const interval = setInterval(() => {
    checkBackend(true);
  }, 30000);
  return () => clearInterval(interval);
}, [backendStatus, checkBackend]);
```

### 2. Wrapped `checkBackend` in `useCallback`

Prevents the function from being recreated on every render, making it stable for dependency arrays:

```typescript
const checkBackend = useCallback(async (isRetry: boolean = false) => {
  // ... implementation
}, []); // Stable function reference
```

### 3. Fixed Retry Logic

Now properly increments `retryCount` on every failure (including retries), allowing up to 5 retries:

```typescript
setRetryCount(prev => {
  if (prev < 5) {
    return prev + 1;
  }
  return prev;
});
```

## Changes Made

### Files Modified:
- `frontend/src/App.tsx`

### Key Improvements:
- ✅ Separated initial check, retry logic, and periodic checks
- ✅ Proper dependency arrays prevent infinite loops
- ✅ `useCallback` ensures stable function references
- ✅ Proper cleanup of intervals and timeouts
- ✅ Retry logic now works correctly for all attempts

## Testing

After this fix:
1. ✅ App should load without continuous rebooting
2. ✅ Initial health check runs once on mount
3. ✅ Retries work correctly (up to 5 attempts with exponential backoff)
4. ✅ Periodic health checks only run when connected
5. ✅ No memory leaks from uncleaned intervals/timeouts

## Verification Steps

1. **Open browser DevTools (F12)**
2. **Check Console tab:**
   - Should see health check logs
   - Should NOT see continuous re-renders
   - Should NOT see multiple intervals being created

3. **Check React DevTools (if installed):**
   - Component should render once on mount
   - Should not see continuous re-renders

4. **Monitor Network tab:**
   - Should see `/api/v1/health` request on initial load
   - Should see retry requests if backend is down (with delays)
   - Should see periodic requests every 30s when connected

## If Issues Persist

If the app still reboots:

1. **Check browser console for errors**
2. **Verify backend is accessible** - The health check might be failing
3. **Check for other infinite loops** - Look for other `useEffect` hooks with problematic dependencies
4. **Clear browser cache** - Old cached code might still be running

## Technical Details

### Why the Original Code Failed:

The original effect had `[retryCount, backendStatus]` as dependencies. Every time:
- `checkBackend()` was called
- It updated `retryCount` or `backendStatus`
- The effect re-ran
- Which called `checkBackend()` again
- Creating an infinite loop

### Why the Fix Works:

1. **Initial effect** only depends on `checkBackend` (stable reference), so it runs once
2. **Retry effect** only runs when `retryCount` or `backendStatus` changes, and properly schedules a single retry
3. **Periodic effect** only runs when `backendStatus` changes to 'connected', and properly cleans up the interval

Each effect has a single, clear responsibility and proper cleanup.
