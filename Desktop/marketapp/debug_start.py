#!/usr/bin/env python3
"""
Debug script to see what Railway is trying to run
"""
import os
import sys

print("=== RAILWAY DEBUG INFO ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")
print(f"Environment variables:")
for key, value in os.environ.items():
    if 'RAILWAY' in key or 'PORT' in key or 'START' in key:
        print(f"  {key} = {value}")

print(f"\nFiles in current directory:")
for item in os.listdir('.'):
    print(f"  {item}")

print(f"\nFiles in /app directory:")
try:
    for item in os.listdir('/app'):
        print(f"  {item}")
except:
    print("  Cannot access /app directory")

print("\n=== END DEBUG INFO ===")

# Try to start the actual application
try:
    print("Attempting to start Gunicorn...")
    import subprocess
    subprocess.run([
        'gunicorn', 
        'backend.wsgi:application', 
        '--bind', '0.0.0.0:8000',
        '--workers', '1',
        '--timeout', '120'
    ])
except Exception as e:
    print(f"Error starting Gunicorn: {e}")
    sys.exit(1)
