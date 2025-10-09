#!/usr/bin/env python
"""
Main entry point for the Django application
"""
import os
import sys
import django
from django.core.wsgi import get_wsgi_application

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')

# Setup Django
django.setup()

# Get WSGI application
application = get_wsgi_application()

if __name__ == "__main__":
    # This is for local development
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
