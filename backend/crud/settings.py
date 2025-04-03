import environ
from pathlib import Path
from datetime import timedelta


env = environ.Env(
    DEBUG=(bool,False),
    MONGO_DB_NAME=(str, 'mydb'),
    MONGO_HOST=(str, 'mongodb://localhost:27017/mydb')
)
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

environ.Env.read_env(BASE_DIR / '.env')
# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

import mongoengine

mongoengine.connect(
    db=env('MONGO_DB_NAME', default='mydb'),
    host=env('MONGO_HOST', default='mongodb://localhost:27017/mydb'),
    alias='default'
)
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = []


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'rest_framework_simplejwt',
    'api',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    #..include the providers you want
    'allauth.socialaccount.providers.google',
]
MIGRATION_MODULES = {
    'api': None,  # Désactive les migrations pour l'app 'api'
}
AUTHENTICATION_BACKENDS = [
     # Needed to login by username in Django admin, regardless of `allauth`
    'api.backends.MongoEngineBackend',
     'api.auth.MongoAuthBackend',
     'api.backends.CustomBackend',  # Vérifie si ce module existe !
    'django.contrib.auth.backends.ModelBackend',

     # `allauth` specific authentication methods, such as login by email
    'allauth.account.auth_backends.AuthenticationBackend',
]
# Dans settings.py
#AUTH_USER_MODEL = 'api.CustomUser'
SITE_ID = 1
# Configuration Allauth
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'optional'

# REST Framework config
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
         'rest_framework_simplejwt.authentication.JWTAuthentication',
    'rest_framework.authentication.SessionAuthentication', 
    ],    
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
     'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

LOGIN_URL = 'login'
LOGOUT_URL = 'logout'
LOGIN_REDIRECT_URL = 'home'

    
SOCIALACCOUNT_PROVIDERS = {
    "google":{
        "SCOPE": [
            "email"
        ],
        "AUTH_PARAMS": {"access_type": "online"}
    }
}
ROOT_URLCONF = 'googlelogin.urls'
# Supprimez la première déclaration et gardez celle-ci :
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ALGORITHM': 'HS256',
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Court pour limiter les risques
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': False,  # Désactivé pour simplifier
    'BLACKLIST_AFTER_ROTATION': False,  # Non nécessaire avec MongoDB
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
     'corsheaders.middleware.CorsMiddleware',
]
CORS_ALLOW_ALL_ORIGINS = True  # En développement uniquement !
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS =[
   'http://localhost:3000'

]



ROOT_URLCONF = 'crud.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'crud.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases
# 1. Désactiver complètement la configuration SQL par défaut
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.dummy'  # Désactive le système de base de données SQL
    }
}


# settings.py

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'  # Ou votre serveur SMTP
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'votre@email.com'
EMAIL_HOST_PASSWORD = 'votre_mot_de_passe'  # Mot de passe d'application pour Gmail

# Configuration pour la réinitialisation
PASSWORD_RESET_TIMEOUT = 3600  # 1 heure en secondes
FRONTEND_RESET_URL = "http://localhost:3000/reset-password"  # URL de votre frontend
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  # Mets True en production avec HTTPS
CORS_ALLOW_CREDENTIALS = True  # Autorise les cookies cross-origin
CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:8000", "http://localhost:3000"]