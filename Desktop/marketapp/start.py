#!/usr/bin/env python3
"""
Simple start script for Railway deployment
"""
import os
import sys
import subprocess

def main():
    """Start the Django application"""
    print("Starting Django application...")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path}")
    print(f"Files in current directory: {os.listdir('.')}")
    
    # Set environment variables
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
    print(f"Django settings module: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
    
    # Check if manage.py exists
    if not os.path.exists('manage.py'):
        print("ERROR: manage.py not found!")
        sys.exit(1)
    
    # Run migrations
    print("Running database migrations...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'migrate', '--settings=backend.settings_production'], check=True)
        print("Migrations completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Migration failed: {e}")
        sys.exit(1)
    
    # Start Gunicorn
    print("Starting Gunicorn server...")
    try:
        subprocess.run([
            'gunicorn', 
            'backend.wsgi:application', 
            '--bind', '0.0.0.0:8000',
            '--workers', '1',
            '--timeout', '120',
            '--access-logfile', '-',
            '--error-logfile', '-'
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Gunicorn failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
