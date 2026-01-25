# How to Fix "Invalid API Key" Error

## Quick Fix Steps

### Step 1: Get a New OpenAI API Key

1. **Go to OpenAI Platform:**
   - Visit: https://platform.openai.com/api-keys
   - Sign in (or create an account if needed)

2. **Create a New Key:**
   - Click "Create new secret key"
   - Give it a name (e.g., "Autism Assistant")
   - Click "Create secret key"
   - **IMPORTANT:** Copy the key immediately (you won't see it again!)

3. **Verify the Key Format:**
   - Should start with `sk-proj-` or `sk-`
   - Should be about 50-100 characters long
   - Example: `sk-proj-abc123...xyz789`

### Step 2: Update Your .env File

1. **Open the file:**
   - Navigate to: `backend/.env`
   - Open in a text editor (Notepad, VS Code, etc.)

2. **Find this line:**
   ```env
   OPENAI_API_KEY=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
   ```

3. **Replace with your new key:**
   ```env
   OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
   ```
   (Replace `YOUR_NEW_KEY_HERE` with the key you copied)

4. **Save the file**

### Step 3: Verify the Key

Run the verification tool:
```bash
.\verify-api-key.bat
```

This will:
- Check if the key is in the correct format
- Test the key with OpenAI API
- Tell you if it's valid or invalid

### Step 4: Restart Backend

**IMPORTANT:** You must restart the backend for the new key to take effect:

1. **Stop the backend:**
   - Go to the terminal running the backend
   - Press `Ctrl+C`

2. **Restart the backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Wait for:**
   - "Server Started Successfully!" message
   - "OpenAI client initialized" message

### Step 5: Test It

1. **Refresh your frontend** (or it should auto-reload)
2. **Go to Chat tab**
3. **Type:** "What is ABA?"
4. **You should get a response!**

## Common Issues

### Issue 1: Key Still Not Working After Update

**Possible causes:**
- Key wasn't saved properly
- Backend wasn't restarted
- Key has no credits/usage limit reached

**Solution:**
1. Double-check the key in `.env` (no extra spaces, correct format)
2. Make sure backend is restarted
3. Check OpenAI usage: https://platform.openai.com/usage

### Issue 2: "Incorrect API key provided"

**This means:**
- The key is invalid or expired
- The key was revoked
- The key doesn't have the right permissions

**Solution:**
- Create a new key at https://platform.openai.com/api-keys
- Make sure you copy the ENTIRE key (it's long!)

### Issue 3: "You exceeded your current quota"

**This means:**
- Your OpenAI account has no credits
- You've used up your free tier credits

**Solution:**
1. Go to: https://platform.openai.com/account/billing
2. Add payment method
3. Add credits to your account

### Issue 4: Key Format Looks Wrong

**Valid formats:**
- `sk-proj-...` (newer format)
- `sk-...` (older format)

**Invalid:**
- Keys that don't start with `sk-`
- Keys that are too short (< 40 characters)
- Keys with spaces or line breaks

## Verification Checklist

- [ ] API key copied from OpenAI platform
- [ ] Key starts with `sk-proj-` or `sk-`
- [ ] Key is at least 40 characters long
- [ ] Key pasted into `backend/.env` file
- [ ] No extra spaces around the key
- [ ] File saved
- [ ] Backend restarted
- [ ] Verification tool shows key is valid
- [ ] Chat works in frontend

## Alternative: Use Anthropic Claude

If you prefer to use Anthropic's Claude instead:

1. **Get Anthropic API Key:**
   - Visit: https://console.anthropic.com/
   - Create an account and get an API key

2. **Update `.env`:**
   ```env
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. **Restart backend**

## Need Help?

1. **Run diagnostic:** `.\verify-api-key.bat`
2. **Check backend logs** - Look for specific error messages
3. **Test key directly:** Use the verification tool
4. **Check OpenAI status:** https://status.openai.com/

## Quick Test Command

Test your API key directly (replace YOUR_KEY):
```bash
curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"
```

If you get a list of models, your key is valid!
