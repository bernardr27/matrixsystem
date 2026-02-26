# Citadel Login Testing Guide  
**Updated:** 2026-02-23 | **Status:** Ready for Testing

## Quick Test Checklist

### Test 1: Verify Dev Server Running
- [ ] Open `http://localhost:3005` in browser
- [ ] Login page loads correctly
- [ ] No console errors visible

### Test 2: Check Which Auth Method Shows
The page should display ONE of these:
- [ ] **Discord Button** - If Supabase is properly configured and reachable
- [ ] **Username/Password Form** - If Supabase is not configured or unreachable

**What to look for:**
- Username field with placeholder "operator"
- Password field with masked input
- Help text: "Default: operator / citadel"
- Submit button says "Sign In"

### Test 3: Local Authentication Test (Primary Test)
**If you see the username/password form:**
1. Enter credentials:
   - Username: `operator`
   - Password: `citadel`
2. Click "Sign In"
3. Watch for boot sequence animation
4. Verify redirect to `/dashboard`

**Expected Results:**
- ✅ No error message
- ✅ Boot sequence shows 6 steps completing
- ✅ Page redirects to dashboard

### Test 4: Discord OAuth Test (If Supabase Shows)
**If you see the Discord button:**
1. Click "Login with Discord"
2. You'll be redirected to Discord OAuth
3. Complete Discord authentication

**Expected Results:**
- ✅ Redirected to Discord
- ✅ After allowing permission, redirected back to Citadel
- ✅ Boot sequence runs
- ✅ Dashboard loads

### Test 5: Fallback Button Test (If Discord Button Shows)
1. Look for button text: "Use Local Authentication Instead"
2. Click the fallback button
3. Form should switch to username/password inputs
4. Enter credentials: operator / citadel
5. Click "Sign In"

**Expected Results:**
- ✅ Form visibly changes
- ✅ Username/password fields appear
- ✅ Local login works

### Test 6: Invalid Credentials Test
1. Go to login page (clear cookies if needed)
2. If local form visible, try:
   - Username: `operator`
   - Password: `wrong_password`
3. Click "Sign In"

**Expected Results:**
- ✅ Error message appears: "Invalid credentials"
- ✅ Login form remains visible
- ✅ Can retry with correct password

### Test 7: Empty Form Test
1. Go to login page
2. Leave username and/or password empty
3. Click "Sign In"

**Expected Results:**
- ✅ Form submission succeeds (browser allows empty JSON)
- ✅ Server returns error: "Invalid credentials"
- ✅ Error displays on page

## URL Endpoints to Test

### Get Citadel Login Page
```
GET http://localhost:3005/
```
Response: HTML login page (200 OK)

### Test Local Login API
```
POST http://localhost:3005/api/auth
Content-Type: application/json

{
  "action": "login",
  "username": "operator",
  "password": "citadel"
}
```
Expected Response:
```json
{
  "success": true
}
```
Status: 200 OK  
Cookies: citadel_session (httpOnly)

### Test Invalid Credentials
```
POST http://localhost:3005/api/auth
Content-Type: application/json

{
  "action": "login",
  "username": "operator",
  "password": "wrong"
}
```
Expected Response:
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```
Status: 401 Unauthorized

### Check Session Status
```
GET http://localhost:3005/api/auth
```
Response (authenticated):
```json
{
  "authenticated": true,
  "username": "Matrix Operator",
  "createdAt": "...",
  "expiresAt": null,
  "avatar": null
}
```
Status: 200 OK

Response (not authenticated):
```json
{
  "authenticated": false
}
```
Status: 401 Unauthorized

### Test Logout
```
POST http://localhost:3005/api/auth
Content-Type: application/json

{
  "action": "logout"
}
```
Expected Response:
```json
{
  "success": true
}
```
Status: 200 OK

## Browser Console Inspection

### Add Debug Logging
Open browser DevTools (F12) and paste in Console:
```javascript
// Check Supabase configuration detection
const checkSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  console.log('Supabase URL:', url);
  console.log('Supabase Key:', key.slice(0, 20) + '...');
  console.log('Is Configured:', url.length > 0 && key.length > 0);
};
checkSupabase();
```

## Server Logs to Monitor

The dev server logs (in terminal) should show:
- `GET / 200` - Page load
- `POST /api/auth 200` - Successful login
- `POST /api/auth 401` - Failed login (wrong password)
- `GET /api/auth 200` - Session check (authenticated)
- `GET /api/auth 401` - Session check (not authenticated)

## Troubleshooting

### Issue: Discord button shows, but Discord auth fails
**Solution:** The Supabase service might be unreachable. Click "Use Local Authentication Instead" to use fallback.

### Issue: "Invalid credentials" error
**Check:**
- Username is exactly `operator` (case-sensitive)
- Password is exactly `citadel` (case-sensitive)
- No extra spaces before/after
- Caps Lock is off

### Issue: Page doesn't load at all
**Check:**
- Dev server is running: `npm run dev` from g:\matrix\apps\citadel\
- Port 3005 is accessible: `curl http://localhost:3005`
- No firewall blocking the port

### Issue: Form submits but no response
**Check:**
- Network tab in DevTools shows POST request to /api/auth
- Response code (should be 200 or 401)
- Browser console for JavaScript errors

### Issue: Boot sequence doesn't start
**Check:**
- Authentication succeeded (check response from /api/auth)
- No JavaScript errors in console
- Page hasn't redirected yet (should redirect after boot)

## Success Indicators

✅ **Complete Success** when ALL are true:
1. Login page loads without errors
2. Correct auth form/button appears (Discord OR local)
3. Can login with operator/citadel
4. Boot sequence runs with all 6 steps visible
5. Gets redirected to /dashboard
6. Dashboard loads (shows command apps, etc.)

⚠️ **Partial Success** (fallback working):
1. Discord button shows but doesn't work
2. Fallback button works
3. Local auth succeeds
4. Boot sequence and dashboard work

🔴 **Failure** if:
1. Page doesn't load
2. Any step fails with error
3. Login returns error for correct credentials
4. No redirect to dashboard

## Testing Tips
- Clear browser cookies (or use private/incognito mode) for fresh session
- Check DevTools Network tab to see actual requests/responses
- Monitor terminal output of `npm run dev` for server logs
- Refresh page if changes don't appear (may need cache clear)
- Test in different browsers if having issues

## After Testing
Please report:
- Which authentication method appears (Discord or Local)
- Whether login succeeds with operator/citadel
- Any errors encountered
- Screenshots of login page and boot sequence
- Server log output if there are issues

For detailed implementation documentation, see:
- `CITADEL_AUTH_FALLBACK_IMPLEMENTATION.md`
