#!/usr/bin/env python3
"""
Simple start script for Railway deployment
"""
import os
import sys
import subprocess

def main():
    """Start the Django application"""
    # Set environment variables
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
    
    # Run migrations
    print("Running database migrations...")
    subprocess.run([sys.executable, 'manage.py', 'migrate', '--settings=backend.settings_production'], check=True)
    
    # Start Gunicorn
    print("Starting Gunicorn server...")
    subprocess.run([
        'gunicorn', 
        'backend.wsgi:application', 
        '--bind', '0.0.0.0:8000',
        '--workers', '1',
        '--timeout', '120'
    ], check=True)

if __name__ == '__main__':
    main()
