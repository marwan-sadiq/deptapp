#!/usr/bin/env python3
"""
Ultra-simple health check for Railway
"""
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def health_check():
    """Simple health check that always returns success"""
    return {"status": "healthy", "service": "deptapp"}

if __name__ == "__main__":
    try:
        result = health_check()
        print(f"Health check: {result}")
        sys.exit(0)
    except Exception as e:
        print(f"Health check failed: {e}")
        sys.exit(1)
