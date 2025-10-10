# Railway Environment Variables

Set these environment variables in your Railway project settings:

## Required Variables

```
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-app-name.railway.app,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://your-app-name.railway.app,http://localhost:3000
```

## Database (Auto-configured by Railway)

Railway will automatically set `DATABASE_URL` when you add a PostgreSQL database.

## Optional Variables

```
DEBUG=False
DJANGO_SETTINGS_MODULE=backend.settings_production
```

## How to Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add each variable with its value
5. Redeploy your service

## Health Check

The application includes a health check endpoint at `/` and `/health/` that returns:
```json
{"status": "healthy", "service": "deptapp"}
```

This is used by Railway to verify the service is running correctly.
