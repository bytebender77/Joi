# 🚀 Deployment Guide for Joi

This guide will help you deploy Joi to:
- **Render** - Backend (Python/FastAPI with WebSockets)
- **Vercel** - Frontend (Static HTML/CSS/JS)

## Prerequisites

1. A [GitHub](https://github.com) account
2. A [Render](https://render.com) account (free tier available)
3. A [Vercel](https://vercel.com) account (free tier available)
4. Your **Supabase** project already set up with tables
5. Your **Groq API key**

---

## Step 1: Push to GitHub

```bash
cd /path/to/joi
git init
git add .
git commit -m "Initial commit - Joi AI Companion"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/joi.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `joi-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables**:
   - `GROQ_API_KEY` = your Groq API key
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_KEY` = your Supabase anon key
6. Click **Create Web Service**
7. Wait for deployment (takes 2-5 minutes)
8. Copy your backend URL: `https://joi-backend.onrender.com`

---

## Step 3: Update Frontend Config

Before deploying frontend, update the backend URL:

1. Edit `frontend/config.js`:
```javascript
const CONFIG = {
    BACKEND_URL: 'wss://joi-backend.onrender.com'  // Your Render URL
};
```

2. Commit and push:
```bash
git add frontend/config.js
git commit -m "Update backend URL for production"
git push
```

---

## Step 4: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Other`
5. Click **Deploy**
6. Your frontend will be at: `https://joi-xxxxx.vercel.app`

---

## Environment Variables Summary

### Render (Backend)
| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Your Groq API key |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_KEY` | Supabase anon/public key |

### Vercel (Frontend)
No environment variables needed - config is in `config.js`

---

## Troubleshooting

### WebSocket Connection Failed
- Make sure your Render backend is running (check Render logs)
- Verify `config.js` has the correct `wss://` URL (not `ws://`)
- Render free tier may sleep after inactivity - first request takes longer

### Database Errors
- Verify Supabase tables are created
- Check Supabase API keys are correct
- Ensure Supabase project is not paused

### CORS Issues
- The backend already allows all origins for WebSocket connections
- If using fetch requests, you may need to add CORS middleware

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed

### Render
1. Go to Service Settings → Custom Domains
2. Add your domain
3. Configure DNS CNAME record

---

## Costs

| Service | Free Tier Limits |
|---------|------------------|
| Render | 750 hours/month, sleeps after 15min inactivity |
| Vercel | 100GB bandwidth, unlimited deploys |
| Supabase | 500MB database, 2GB bandwidth |
| Groq | Generous free tier for API calls |

---

**Your Joi companion is now live! 💕**
