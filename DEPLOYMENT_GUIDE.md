# 🚀 Market App Deployment Guide

## Quick Start (Recommended)

### Option 1: Vercel + Railway (Easiest)

#### Frontend (Vercel)
1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set build command: `cd frontend && npm run build`
   - Set output directory: `frontend/dist`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```

#### Backend (Railway)
1. **Connect to Railway:**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Add PostgreSQL database

2. **Environment Variables:**
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-backend-url.railway.app
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
   DATABASE_URL=postgresql://...
   ```

3. **Deploy:**
   - Railway will automatically deploy when you push to main branch

### Option 2: Netlify + Render

#### Frontend (Netlify)
1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Import from Git
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`

#### Backend (Render)
1. **Connect to Render:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect GitHub repository
   - Add PostgreSQL database

2. **Environment Variables:**
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-backend-url.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend-url.netlify.app
   DATABASE_URL=postgresql://...
   ```

### Option 3: All-in-One (Railway)

1. **Deploy to Railway:**
   - Connect your GitHub repository
   - Add PostgreSQL database
   - Set environment variables
   - Railway will build both frontend and backend

2. **Environment Variables:**
   ```
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-app.railway.app
   CORS_ALLOWED_ORIGINS=https://your-app.railway.app
   DATABASE_URL=postgresql://...
   ```

## Manual Deployment Steps

### 1. Prepare Your Code

```bash
# Install dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Build frontend
cd frontend && npm run build && cd ..
```

### 2. Environment Variables

Create a `.env` file with:

```env
SECRET_KEY=your-very-secure-secret-key-here
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DATABASE_URL=postgresql://username:password@host:port/database
```

### 3. Database Setup

For production, use PostgreSQL:

```bash
# Install PostgreSQL locally or use cloud service
# Create database
createdb marketapp_production

# Run migrations
python manage.py migrate
```

### 4. Static Files

```bash
# Collect static files
python manage.py collectstatic --noinput

# Serve static files (use nginx or CDN in production)
python manage.py runserver
```

## Security Checklist

- [ ] Change `SECRET_KEY` to a secure random string
- [ ] Set `DEBUG=False`
- [ ] Configure `ALLOWED_HOSTS` properly
- [ ] Set up HTTPS/SSL
- [ ] Use environment variables for sensitive data
- [ ] Enable database connection pooling
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## Performance Optimization

### Frontend
- Enable gzip compression
- Use CDN for static assets
- Implement caching strategies
- Optimize images and assets

### Backend
- Use database connection pooling
- Enable caching (Redis recommended)
- Optimize database queries
- Use a reverse proxy (nginx)

## Monitoring

### Recommended Tools
- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry, Rollbar
- **Performance**: New Relic, DataDog
- **Logs**: Papertrail, Loggly

## Backup Strategy

### Database
```bash
# Daily backup
pg_dump your_database > backup_$(date +%Y%m%d).sql
```

### Files
- Regular backups of media files
- Version control for code
- Environment variable backup

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ALLOWED_ORIGINS` setting
   - Ensure frontend URL is included

2. **Static Files Not Loading**
   - Run `collectstatic` command
   - Check `STATIC_ROOT` setting
   - Configure web server to serve static files

3. **Database Connection Issues**
   - Verify `DATABASE_URL` format
   - Check database server status
   - Ensure firewall allows connections

4. **Build Failures**
   - Check Node.js version compatibility
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall

### Getting Help

- Check application logs
- Review platform-specific documentation
- Test locally with production settings
- Use debugging tools

## Cost Estimation

### Free Tiers
- **Vercel**: Free for personal projects
- **Netlify**: Free tier available
- **Railway**: $5/month after free credits
- **Render**: Free tier with limitations

### Paid Options
- **Vercel Pro**: $20/month
- **Railway**: $5-20/month
- **Render**: $7-25/month
- **DigitalOcean**: $5-25/month

## Next Steps After Deployment

1. **Set up custom domain**
2. **Configure SSL certificate**
3. **Set up monitoring**
4. **Create backup strategy**
5. **Performance testing**
6. **Security audit**

---

**Need help?** Check the logs, review this guide, or create an issue in the repository.
