#!/bin/bash
set -e

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate --settings=backend.settings_production

echo "Collecting static files..."
python manage.py collectstatic --noinput --settings=backend.settings_production

echo "Build completed successfully!"
