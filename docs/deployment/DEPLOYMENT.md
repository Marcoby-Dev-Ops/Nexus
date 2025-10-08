# Deploying Nexus OS on Coolify

This guide will help you deploy Nexus OS using Coolify with your GitHub repository.

---

## 1. Prerequisites
- A Coolify account
- This repository connected to Coolify via GitHub
- (Optional) A managed PostgreSQL database on Coolify or elsewhere

---

## 2. Environment Variables

### Backend (`server/.env`)
Copy `server/.env.example` to `server/.env` and set the following:

```
PORT=4000 # Coolify will inject this automatically
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/nexus # Set from your Coolify Postgres service
OPENROUTER_API_KEY= # (Optional) For AI features
```

### Frontend (`client/.env`)
Copy `client/.env.example` to `client/.env` and set:

```
VITE_API_BASE_URL=https://your-backend-url.coolify.app
VITE_OPENROUTER_API_KEY= # (Optional)
```

---

## 3. Build & Start
Coolify will auto-detect the Dockerfiles in `client/` and `server/` and build each service.

- **Frontend**: Served by Nginx on port 80
- **Backend**: Node.js app, listens on `PORT` (injected by Coolify)

---

## 4. Health Checks
- **Backend**: Set health check to `/health` (GET)
- **Frontend**: Set health check to `/` (GET)

---

## 5. Database
- Use Coolify's managed Postgres or connect your own.
- Set the `DATABASE_URL` in the backend environment variables.

---

## 6. Testing
- After deployment, visit your frontend and backend URLs to verify.
- Use the `/health` endpoint on the backend to check status.

---

## 7. Troubleshooting
- Check Coolify build logs for errors.
- Ensure all environment variables are set.
- Make sure the backend is accessible from the frontend (CORS, network).

---

For more help, see the main `README.md` or open an issue. 