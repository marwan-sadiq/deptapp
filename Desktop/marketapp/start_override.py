#!/usr/bin/env python3
"""
Override start script that checks environment variables
"""
import os
import sys
import subprocess

def main():
    """Start the Django application with environment variable override"""
    print("=== RAILWAY START OVERRIDE ===")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Files in current directory: {os.listdir('.')}")
    
    # Check if we should use Gunicorn directly
    use_gunicorn = os.environ.get('USE_GUNICORN', 'true').lower() == 'true'
    
    if use_gunicorn:
        print("Using Gunicorn directly...")
        try:
            # Set environment variables
            os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')
            
            # Get port from environment
            port = os.environ.get('PORT', '8000')
            
            # Start Gunicorn
            subprocess.run([
                'gunicorn', 
                'backend.wsgi:application', 
                '--bind', f'0.0.0.0:{port}',
                '--workers', '1',
                '--timeout', '120',
                '--access-logfile', '-',
                '--error-logfile', '-'
            ], check=True)
        except Exception as e:
            print(f"Gunicorn failed: {e}")
            sys.exit(1)
    else:
        print("Using alternative start method...")
        # Fallback to the original start.py if it exists
        if os.path.exists('start.py'):
            subprocess.run([sys.executable, 'start.py'], check=True)
        else:
            print("No start.py found, exiting...")
            sys.exit(1)

if __name__ == '__main__':
    main()
