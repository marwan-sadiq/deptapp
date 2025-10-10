#!/usr/bin/env python3
"""
Simple start script for Railway deployment - alternative approach
"""
import os
import sys
import subprocess

def main():
    """Start the Django application with minimal setup"""
    print("Starting Django application...")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Files in current directory: {os.listdir('.')}")
    
    # Set environment variables
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
    
    # Check if we're in the right directory
    if not os.path.exists('manage.py'):
        print("ERROR: manage.py not found!")
        print("Trying to find manage.py...")
        for root, dirs, files in os.walk('.'):
            if 'manage.py' in files:
                print(f"Found manage.py in: {root}")
                os.chdir(root)
                break
        else:
            print("manage.py still not found!")
            sys.exit(1)
    
    print(f"Changed to directory: {os.getcwd()}")
    
    # Run migrations
    print("Running database migrations...")
    try:
        subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)
        print("Migrations completed successfully")
    except subprocess.CalledProcessError as e:
        print(f"Migration failed: {e}")
        # Don't exit on migration failure, continue with startup
    
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