from setuptools import setup, find_packages

setup(
    name="deptapp",
    version="1.0.0",
    description="Debt Management System",
    packages=find_packages(),
    install_requires=[
        "Django==5.2.7",
        "djangorestframework==3.16.1",
        "django-cors-headers==4.9.0",
        "gunicorn==23.0.0",
        "whitenoise==6.8.2",
        "psycopg2-binary==2.9.9",
        "dj-database-url==2.3.0",
        "python-decouple==3.8",
    ],
)
