@echo off
cd /d "C:\Users\kurd it pc\deptappv1\deptapp"
set SECRET_KEY=django-insecure-local-development-key-12345
set DEBUG=True
set ALLOWED_HOSTS=localhost,127.0.0.1
call venv\Scripts\activate.bat
python manage.py runserver
pause
