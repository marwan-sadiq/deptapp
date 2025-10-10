#!/bin/bash
echo "Starting build process..."

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate --settings=backend.settings_production

echo "Build completed successfully!"