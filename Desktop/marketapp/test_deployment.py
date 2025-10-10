#!/usr/bin/env python3
"""
Test script to verify deployment configuration
"""
import os
import sys
import subprocess

def test_deployment():
    """Test if the deployment configuration is correct"""
    print("Testing deployment configuration...")
    
    # Check if we're in the right directory
    print(f"Current directory: {os.getcwd()}")
    
    # Check if required files exist
    required_files = ['manage.py', 'start.py', 'requirements.txt', 'backend/settings_production.py']
    for file in required_files:
        if os.path.exists(file):
            print(f"[OK] {file} exists")
        else:
            print(f"[ERROR] {file} missing")
            return False
    
    # Check if Django can be imported
    try:
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
        import django
        django.setup()
        print("[OK] Django can be imported and configured")
    except Exception as e:
        print(f"[ERROR] Django import failed: {e}")
        return False
    
    # Check if manage.py works
    try:
        result = subprocess.run([sys.executable, 'manage.py', 'check', '--settings=backend.settings_production'], 
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            print("[OK] Django check passed")
        else:
            print(f"[ERROR] Django check failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERROR] Django check error: {e}")
        return False
    
    print("[OK] All deployment tests passed!")
    return True

if __name__ == '__main__':
    success = test_deployment()
    sys.exit(0 if success else 1)
