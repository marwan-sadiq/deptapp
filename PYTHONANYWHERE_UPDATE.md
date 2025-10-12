# PythonAnywhere Update Guide

## Quick Update Steps

### 1. Access Your PythonAnywhere Console
- Log into your PythonAnywhere account
- Go to the "Consoles" tab
- Open a Bash console

### 2. Navigate to Your Project
```bash
cd /home/yourusername/deptapp
# Replace 'yourusername' with your actual PythonAnywhere username
```

### 3. Pull Latest Changes
```bash
git pull origin master
```

### 4. Activate Virtual Environment
```bash
source venv/bin/activate
```

### 5. Update Dependencies
```bash
# Update Python dependencies
pip install -r requirements.txt

# Update Node.js dependencies
cd frontend
npm install
cd ..
```

### 6. Run Database Migrations
```bash
python manage.py migrate
```

### 7. Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### 8. Build Frontend
```bash
cd frontend
npm run build
cd ..
```

### 9. Restart Web App
- Go to the "Web" tab in PythonAnywhere dashboard
- Click the "Reload" button for your web app

## What's New in This Update

### 🎨 Mobile & Tablet Responsiveness
- ✅ Responsive navigation (2-column grid on mobile)
- ✅ Mobile-friendly dashboard layout
- ✅ Improved payment planner with centered generate button
- ✅ Better currency input layout for mobile devices
- ✅ Optimized stat cards for all screen sizes

### 💰 Currency Improvements
- ✅ Currency symbols instead of names ($, €, £, د.ع)
- ✅ Proper translations for all languages
- ✅ Multi-currency support across all components

### 🔧 Production Optimizations
- ✅ Enhanced security settings
- ✅ Optimized Vite build configuration
- ✅ Better error handling
- ✅ Performance improvements

### 🐛 Bug Fixes
- ✅ Fixed React hooks violation in TopDebtors component
- ✅ Improved error boundaries
- ✅ Better TypeScript support

## Troubleshooting

### If you get permission errors:
```bash
chmod +x update_pythonanywhere.sh
./update_pythonanywhere.sh
```

### If npm install fails:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
cd ..
```

### If migrations fail:
```bash
python manage.py showmigrations
python manage.py migrate --fake-initial
```

### If static files don't update:
```bash
python manage.py collectstatic --clear --noinput
```

## Verification

After updating, check:
1. ✅ Website loads without errors
2. ✅ Mobile layout looks good
3. ✅ Currency symbols display correctly
4. ✅ All features work as expected
5. ✅ No console errors in browser

## Support

If you encounter any issues:
1. Check the PythonAnywhere error logs
2. Verify all dependencies are installed
3. Ensure database migrations completed successfully
4. Check that the frontend build completed without errors
