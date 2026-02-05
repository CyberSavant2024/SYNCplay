# 🚀 YouTube Music Sync - Deployment Guide

## ☁️ Deploy to Render (Recommended - Free Tier)

### Prerequisites

- GitHub account
- Render account (sign up at https://render.com)

### Step 1: Push to GitHub

Your code is already at: https://github.com/CyberSavant2024/SYNCplay

If you make changes:

```bash
git add .
git commit -m "Update deployment configuration"
git push origin main
```

### Step 2: Deploy on Render

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Connect your GitHub account
   - Select repository: `CyberSavant2024/SYNCplay`
   - Click "Connect"

3. **Configure Service**

   ```
   Name:          youtube-sync-player (or your choice)
   Region:        Choose closest to you
   Branch:        main
   Runtime:       Node
   Build Command: npm install
   Start Command: npm start
   Plan:          Free
   ```

4. **Environment Variables** (Optional but recommended)
   - Click "Advanced"
   - Add environment variable:
     - Key: `NODE_ENV`
     - Value: `production`

5. **Deploy**
   - Click "Create Web Service"
   - Wait 2-5 minutes for deployment
   - You'll get a URL like: `https://youtube-sync-player.onrender.com`

### Step 3: Test Your Deployment

1. Open the Render URL in your browser
2. Create a room
3. Open the same URL on another device (can be anywhere in the world!)
4. Join with the room code
5. Start syncing!

---

## 🌐 Deploy to Other Platforms

### Heroku

1. **Install Heroku CLI**

   ```bash
   # Download from: https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Deploy**
   ```bash
   heroku login
   heroku create youtube-sync-player
   git push heroku main
   heroku open
   ```

### Railway

1. Visit https://railway.app
2. "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and deploys
5. Get your public URL

### Vercel (Requires slight modification)

Vercel is optimized for static/serverless, but can work with this setup using their serverless functions.

---

## 🎯 Using Your Deployed App

### ✅ Advantages of Cloud Deployment

- **Global Access**: Anyone with internet can join
- **No Port Forwarding**: No router configuration needed
- **No Firewall Issues**: No Windows Firewall setup
- **Always Available**: Access from anywhere
- **Single URL**: Everyone uses the same link

### 📱 How to Use

**Host:**

1. Share deployment URL with friends
2. Go to URL and create room
3. Share 6-character room code
4. Paste YouTube links and control playback

**Guests:**

1. Open the same URL
2. Enter room code
3. Watch in perfect sync!

### ⚠️ Free Tier Limitations

**Render Free:**

- Spins down after 15 min of inactivity
- Takes ~30s to wake up on first request
- 750 hours/month limit (enough for personal use)

**Solutions:**

- Use paid plan ($7/month) for 24/7 uptime
- Use UptimeRobot to ping your app every 10 min (keeps it awake)
- Accept the 30s wake-up delay

---

## 🔧 Troubleshooting

### App Won't Start

- Check Render logs for errors
- Verify `package.json` has correct Node version
- Ensure all dependencies are in `dependencies` (not `devDependencies`)

### Socket.IO Not Connecting

- CORS is configured for `*` (all origins)
- Check browser console for errors
- Verify WebSocket isn't blocked by browser extension

### Video Won't Load

- Ensure video is not region-restricted
- Check YouTube video ID is correct
- Try a different video

---

## 📊 Monitoring

**View Logs:**

- Render: Dashboard → Your Service → Logs tab
- Heroku: `heroku logs --tail`

**Metrics:**

- Active connections
- Room count
- Errors and warnings

---

## 🔐 Security Notes

- No authentication implemented (anyone with URL can access)
- Room codes are 6 random characters
- Rooms auto-close when host leaves
- Consider adding password protection for private use

---

## 💡 Next Steps

- Add room passwords for privacy
- Implement user nicknames
- Add chat functionality
- Save favorite playlists
- Add video queue system

---

## 📞 Support

Issues? Check:

- GitHub Issues: https://github.com/CyberSavant2024/SYNCplay/issues
- Render Status: https://status.render.com
- Socket.IO Docs: https://socket.io/docs/
- First request takes ~30 seconds to wake up
- Limited compute and bandwidth

### Upgrade for Better Performance

- Use "Standard" plan ($7/month) for always-on service
- Faster startup times
- More reliable syncing

## Local Development

Still works as before:

```bash
npm install
npm start
```

Visit: `http://localhost:3000`

## Architecture Notes

- WebSocket connections automatically upgrade to secure WebSocket (wss://) on HTTPS
- Health check endpoint: `/health`
- Server handles both local and production deployments automatically
