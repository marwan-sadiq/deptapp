"""
PythonAnywhere settings for Django deployment
"""
import os
from .settings import *

# Override settings for PythonAnywhere
DEBUG = False
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set in production!")

# PythonAnywhere domain
ALLOWED_HOSTS = [
    "donnmero.pythonanywhere.com",
    "www.donnmero.pythonanywhere.com",
    "localhost",
    "127.0.0.1",
]

# Database - using SQLite for PythonAnywhere (free tier)
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Static files configuration for PythonAnywhere
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Media files (if you have any)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# CORS settings for PythonAnywhere - Updated with your frontend URL
CORS_ALLOWED_ORIGINS = [
    "https://donnmero.pythonanywhere.com",
    "https://deptapp.vercel.app",  # Your frontend URL
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Allow all origins for now (for testing)
CORS_ALLOW_ALL_ORIGINS = True

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Session and CSRF settings
SESSION_COOKIE_SECURE = False  # Set to True if using HTTPS
CSRF_COOKIE_SECURE = False     # Set to True if using HTTPS

# Logging configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": os.path.join(BASE_DIR, "django.log"),
            "formatter": "verbose",
        },
        "console": {
            "level": "WARNING",
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["file", "console"],
            "level": "INFO",
            "propagate": True,
        },
        "core.views": {
            "handlers": ["file"],
            "level": "INFO",
            "propagate": True,
        },
    },
}
