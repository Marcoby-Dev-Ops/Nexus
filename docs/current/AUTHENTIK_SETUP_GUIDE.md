# 🔧 Authentik Setup Guide - CORS Fix

## Problem Solved ✅

The CORS error has been resolved by routing Authentik API calls through your Nexus backend server instead of calling Authentik directly from the frontend.

## Environment Variables Needed

### Backend (.env in server directory)
```env
# Authentik Configuration
AUTHENTIK_BASE_URL=https://identity.marcoby.com
AUTHENTIK_API_TOKEN=your_authentik_api_token_here
```

### Frontend (.env in client directory)
```env
# Nexus API Configuration
VITE_NEXUS_API_URL=http://localhost:3001
```

## Setup Steps

### 1. Get Authentik API Token
1. Log into Authentik admin: `https://identity.marcoby.com`
2. Go to **System > Tokens & App passwords**
3. Click **Create Token**
4. Name: "Nexus Signup Service"
5. Copy the token

### 2. Add Environment Variables
- **Backend**: Add `AUTHENTIK_API_TOKEN` to `server/.env`
- **Frontend**: Add `VITE_NEXUS_API_URL` to `client/.env`

### 3. Restart Servers
```bash
# Restart backend server
cd server && npm run dev

# Restart frontend server  
cd client && npm run dev
```

## How It Works Now

1. **Frontend** → Calls `http://localhost:3001/api/auth/create-user`
2. **Backend** → Calls `https://identity.marcoby.com/api/v3/core/users/`
3. **No CORS Issues** → Backend handles all Authentik communication

## Test the Fix

1. Fill out the signup form
2. Submit the form
3. Check backend logs for successful user creation
4. Verify user appears in Authentik admin panel

The signup flow should now work without CORS errors! 🎉
