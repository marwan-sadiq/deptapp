#!/bin/bash

# Market App Deployment Script
echo "🚀 Starting Market App deployment..."

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies
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

echo "✅ Deployment preparation complete!"
echo "📋 Next steps:"
echo "1. Set up your production environment variables"
echo "2. Deploy to your chosen platform"
echo "3. Configure your domain and SSL"
