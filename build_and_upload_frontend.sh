#!/bin/bash

# Build frontend locally and prepare for PythonAnywhere upload
echo "🏗️ Building frontend locally for PythonAnywhere upload..."

# Build the frontend
cd frontend
npm run build
cd ..

# Create a zip file of the built frontend
echo "📦 Creating upload package..."
cd frontend/dist
zip -r ../../frontend_build.zip .
cd ../..

echo "✅ Frontend built and packaged!"
echo "📁 Upload package created: frontend_build.zip"
echo ""
echo "📋 Next steps for PythonAnywhere:"
echo "1. Upload frontend_build.zip to your PythonAnywhere files"
echo "2. Extract it to ~/deptapp/frontend/dist/"
echo "3. Run: python manage.py collectstatic --noinput"
echo "4. Restart your web app"
