# 🚀 Render Deployment Guide

## Free Backend Deployment on Render

### Step 1: Prepare Repository
1. Make sure your repository is public on GitHub
2. All deployment files are already created:
   - `requirements.txt` ✅
   - `render.yaml` ✅
   - `render-build.sh` ✅
   - `Procfile` ✅

### Step 2: Deploy to Render
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub account
5. Select "deptapp" repository
6. Configure the service:
   - **Name**: `deptapp-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
   - **Python Version**: `3.11`

### Step 3: Set Environment Variables
In Render dashboard, go to Environment tab and add:
- `DEBUG`: `False`
- `SECRET_KEY`: Generate a new secret key
- `ALLOWED_HOSTS`: `your-app-name.onrender.com`
- `CORS_ALLOWED_ORIGINS`: `https://your-frontend-url.vercel.app`
- `DATABASE_URL`: Will be provided by Render's PostgreSQL

### Step 4: Add PostgreSQL Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name it `deptapp-db`
3. Copy the connection string to `DATABASE_URL` environment variable

### Step 5: Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your `deptapp` repository
3. Set build directory to `frontend`
4. Deploy

### Step 6: Update API URL
After both deployments:
1. Get your Render backend URL (e.g., `https://deptapp-backend.onrender.com`)
2. Update `frontend/src/api.ts` with the new backend URL
3. Redeploy frontend

## 🆓 Cost: $0/month
- Render: 750 hours/month free (enough for 24/7)
- Vercel: Unlimited free for personal projects
- PostgreSQL: Free tier included

## 🔧 Troubleshooting
- If build fails, check the logs in Render dashboard
- Make sure all environment variables are set
- Verify the database connection string
