# 🏏 Cricket Auction Arena - Hosting & Deployment Guide

This app is a full-stack Node.js + Vite + WebSocket application.
When self-hosted on **Render**, **Railway**, **Fly.io**, or **Vercel/Heroku**, there are:
- **NO 403 Forbidden errors** (Google account login is not required)
- **NO 404 URL not found errors**
- Your friends can join seamlessly from phone, tablet, or PC worldwide.

---

## 🚀 Option 1: Free Hosting on Render.com (Recommended - 2 Minutes)

1. Push this project to your **GitHub** account.
2. Go to [Render.com](https://render.com) and click **"New +" ➡️ "Web Service"**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
5. Click **"Deploy Web Service"**.
6. Render will generate your free URL: `https://your-cricket-auction.onrender.com`.
7. Share that link with your friends — they can join and bid in real time without any permission errors!

---

## ⚡ Option 2: Deploy on Railway.app (Instant)

1. Go to [Railway.app](https://railway.app).
2. Click **"New Project" ➡️ "Deploy from GitHub repo"**.
3. Railway will detect the Node.js project and run `npm run build` & `npm start` automatically.
4. Click **"Generate Domain"** under service settings.
5. Your app is live!

---

## 📦 Option 3: Docker Deployment

A `Dockerfile` is included in the root directory. To run with Docker:

```bash
docker build -t cricket-auction .
docker run -p 3000:3000 cricket-auction
```

---

## 💡 Using Google AI Studio Directly (Without External Hosting)

If you prefer to stay on Google AI Studio:
1. Look at the **top-right corner of Google AI Studio**.
2. Click the **"Share"** button.
3. Select **"Anyone with link can view"** (Publish).
4. Google Cloud Run will deploy the public preview endpoint (`ais-pre-...`).
5. Once published, your friends will no longer see 404 or 403 errors when clicking your shared invite link!
