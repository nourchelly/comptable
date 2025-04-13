from pathlib import Path
import os
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# Chargement des variables d'environnement
from dotenv import load_dotenv
load_dotenv()  # Charge les variables depuis .env

SECRET_KEY = os.getenv('SECRET_KEY')  # Récupère la clé
DEBUG = os.getenv('DEBUG', 'False') == 'True'

# Configuration MongoDB
from mongoengine import connect

connect(
    db=os.getenv('MONGO_DB_NAME', 'mydb'),
    host=os.getenv('MONGO_HOST', 'mongodb://localhost:27017')
)
# SECURITY WARNING: keep the secret key used in production secret!


# SECURITY WARNING: don't run with debug turned on in production!

ALLOWED_HOSTS = []

 # Point clé !
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
    'rest_framework_simplejwt.token_blacklist',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'corsheaders',
    'rest_framework_simplejwt',
    'api',
    'admin_app',
    'comptable',
    'directeur',
    'mongoengine',
    'social_django',
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
    'social_core.backends.google.GoogleOAuth2',
     # Needed to login by username in Django admin, regardless of `allauth`
    'api.backends.MongoEngineBackend',
    #'api.backends.MongoBackend',
    #'api.auth.MongoAuthBackend',
    #'api.backends.CustomBackend',  # Vérifie si ce module existe !
    'django.contrib.auth.backends.ModelBackend',

     # `allauth` specific authentication methods, such as login by email
    #'allauth.account.auth_backends.AuthenticationBackend',
]
# Dans settings.py
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
APPEND_SLASH = False

#AUTH_USER_MODEL = 'api.CustomUser'
SITE_ID = 1
# Configuration Allauth
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'optional'
LOGIN_REDIRECT_URL = '/'
# REST Framework config
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
    'rest_framework.authentication.BasicAuthentication',
    'rest_framework_simplejwt.authentication.JWTAuthentication',
    'rest_framework.authentication.SessionAuthentication', 
    ],    
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
         'rest_framework.permissions.AllowAny',
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
from corsheaders.defaults import default_headers

CORS_ALLOW_HEADERS = list(default_headers) + [
    'authorization',
]

LOGIN_URL = 'login'
LOGOUT_URL = 'logout'
LOGIN_REDIRECT_URL = 'home'

    
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': '11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com',
            'secret': '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',
            'key': ''
        },
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    }
}

# Supprimez la première déclaration et gardez celle-ci :
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'BLACKLIST_AFTER_ROTATION': True,
    'ROTATE_REFRESH_TOKENS': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
}
ACCOUNT_FORMS = {
    'signup': 'api.forms.CustomSignupForm',  # Chemin corrigé pour votre app 'api'
}
CSRF_COOKIE_NAME = "csrftoken"
CSRF_HEADER_NAME = "X-CSRFToken"
CSRF_TRUSTED_ORIGINS = ['http://127.0.0.1:8000', 'http://localhost:8000']

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
# settings.py

# Commenter ou supprimer cette section si vous utilisez MongoDB uniquement
#DATABASES = {
   # 'default': {
       # 'ENGINE': 'django.db.backends.sqlite3',  # Cette ligne est problématique
       # 'NAME': BASE_DIR / 'db.sqlite3',
  #  }
#}




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
EMAIL_HOST_USER = 'nourchelly11@gmail.com'
EMAIL_HOST_PASSWORD = 'lpnu gdil gzzp ddvx'  # Mot de passe d'application pour Gmail

# Configuration pour la réinitialisation
PASSWORD_RESET_TIMEOUT = 3600  # 1 heure en secondes
FRONTEND_RESET_URL = "http://localhost:3000/reset-password"  # URL de votre frontend
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  # Mets True en production avec HTTPS
CORS_ALLOW_CREDENTIALS = True  # Autorise les cookies cross-origin
CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:8000", "http://localhost:3000"]
FRONTEND_URL = 'http://localhost:3000'