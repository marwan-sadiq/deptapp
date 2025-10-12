#!/bin/bash

# PythonAnywhere Update Script
echo "🔄 Updating PythonAnywhere deployment..."

# Navigate to your project directory (adjust path as needed)
cd /home/yourusername/deptapp

# Pull latest changes from GitHub
echo "📥 Pulling latest changes from GitHub..."
git pull origin master

# Activate virtual environment (adjust path as needed)
echo "🐍 Activating virtual environment..."
source venv/bin/activate

# Install/update Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install/update Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd frontend
npm install
cd ..

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Build frontend
echo "🏗️ Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Update complete!"
echo "🔄 Please restart your web app in the PythonAnywhere dashboard"
echo "📋 Steps to restart:"
echo "1. Go to your PythonAnywhere dashboard"
echo "2. Click on 'Web' tab"
echo "3. Click the 'Reload' button for your web app"
