# This file helps Railway detect this as a Python app
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings_production')

import django
django.setup()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
