#!/usr/bin/env python3
"""
Simple start script for Railway - no migrations
"""
import os
import sys

def main():
    """Start the Django application without migrations"""
    # Set environment variables
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
    
    print("Starting Django application...")
    
    # Start Gunicorn directly
    import subprocess
    subprocess.run([
        'gunicorn', 
        'backend.wsgi:application', 
        '--bind', '0.0.0.0:8000',
        '--workers', '1',
        '--timeout', '30'
    ], check=True)

if __name__ == '__main__':
    main()
