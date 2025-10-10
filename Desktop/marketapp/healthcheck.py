#!/usr/bin/env python3
"""
Simple health check script for Railway
This runs before Django is fully loaded
"""
import os
import sys
import time

def simple_health_check():
    """Simple health check that doesn't require Django"""
    try:
        # Check if we can import basic modules
        import django
        from django.conf import settings
        
        # Try to load Django settings
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
        django.setup()
        
        return True
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

if __name__ == "__main__":
    if simple_health_check():
        print("Health check passed")
        sys.exit(0)
    else:
        print("Health check failed")
        sys.exit(1)
