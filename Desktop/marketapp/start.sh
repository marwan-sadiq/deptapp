#!/bin/bash
set -e

echo "Starting Django application..."

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate --settings=backend.settings_production

# Collect static files
python manage.py collectstatic --noinput --settings=backend.settings_production

# Start the application
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000
