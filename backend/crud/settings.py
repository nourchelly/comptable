from pathlib import Path
import os
from datetime import timedelta
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="dj_rest_auth")

BASE_DIR = Path(__file__).resolve().parent.parent

# Chargement des variables d'environnement
from dotenv import load_dotenv
load_dotenv()  # Charge les variables depuis .env

SECRET_KEY = os.getenv('SECRET_KEY')  # Récupère la clé
DEBUG = os.getenv('DEBUG', 'False') == 'True'
# settings.py
GOOGLE_AI_API_KEY = os.getenv('GOOGLE_AI_API_KEY')  # Stockez la clé dans .env
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
    #'rest_framework_simplejwt.token_blacklist',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'corsheaders',
    'rest_framework_simplejwt',
     'rest_framework_mongoengine',
    'api',
   
    'mongoengine',
    'social_django',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    #..include the providers you want
    'allauth.socialaccount.providers.google',
    
]
# Configuration des sessions
SESSION_ENGINE = "django.contrib.sessions.backends.signed_cookies"
SESSION_COOKIE_HTTPONLY = True
MIGRATION_MODULES = {
    'api': None,  # Désactive les migrations pour l'app 'api'
}
AUTHENTICATION_BACKENDS = [
    'social_core.backends.google.GoogleOAuth2',
  
    'api.backends.MongoEngineBackend',
   
    'django.contrib.auth.backends.ModelBackend',

    
]
# Dans settings.py
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]
APPEND_SLASH = False

#AUTH_USER_MODEL = 'api.CustomUser'
SITE_ID = 1
# Configuration Allauth
# Nouveaux paramètres recommandés - À AJOUTER :
# REMPLACER dans settings.py:
# Nouvelle configuration recommandée
ACCOUNT_LOGIN_METHODS = {'username', 'email'}
ACCOUNT_SIGNUP_FIELDS = ['username', 'email']
# Champs d'inscription (format simplifié)# Champs obligatoires lors de l'inscription
#ACCOUNT_USERNAME_REQUIRED = False
#ACCOUNT_AUTHENTICATION_METHOD = 'email'  # Maintenu pour compatibilité
#ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_UNIQUE_EMAIL = True
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
    


# settings.py

TIME_ZONE = 'Africa/Tunis' # Ou le fuseau horaire exact de votre serveur en production
SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}
ACCOUNT_FORMS = {
    'signup': 'api.forms.CustomSignupForm',  # Chemin corrigé pour votre app 'api'
}
CSRF_COOKIE_NAME = "csrftoken"
CSRF_HEADER_NAME = "X-CSRFToken"
CSRF_TRUSTED_ORIGINS = ['http://127.0.0.1:8000', 'http://localhost:8000']

MIDDLEWARE = [
    'allauth.account.middleware.AccountMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
     'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
     'corsheaders.middleware.CorsMiddleware',
]
CORS_ALLOW_ALL_ORIGINS = False  # En développement uniquement !
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
CORS_EXPOSE_HEADERS = ['Authorization']  # Nouvelle ligne clé
# settings.py

TIME_ZONE = 'Africa/Tunis'

USE_I18N = True

USE_TZ = False


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
EMAIL_HOST_PASSWORD = 'lpnu gdil gzzp ddvx' 
DEFAULT_FROM_EMAIL = 'nourchelly11@gmail.com' # Mot de passe d'application pour Gmail

# Configuration pour la réinitialisation
PASSWORD_RESET_TIMEOUT = 3600  # 1 heure en secondes
FRONTEND_RESET_URL = "http://localhost:3000/reset-password"  # URL de votre frontend
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  # Mets True en production avec HTTPS
CORS_ALLOW_CREDENTIALS = True  # Autorise les cookies cross-origin
CSRF_TRUSTED_ORIGINS = ["http://127.0.0.1:8000", "http://localhost:3000"]
FRONTEND_URL = 'http://localhost:3000'
# Configuration des sessions
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # Mettez True en production avec HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_NAME = 'sessionid'
# Suppression de la section 'DATABASES' pour éviter le conflit
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'), # Remplacez par le nom de votre base de données
    }
}

# Taille max des uploads (20MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 20971520
FILE_UPLOAD_MAX_MEMORY_SIZE = 20971520
# Configuration GridFS
DEFAULT_FILE_STORAGE = 'mongoengine.storage.GridFSStorage'
GRIDFS_DATABASE = 'mydb' 
# Google OAuth Configuration
GOOGLE_OAUTH_CLIENT_ID = "11479995049-09n7oceljn4sgmodv5til5uj7bd072jp.apps.googleusercontent.com"  # Votre ID client
GOOGLE_OAUTH_CLIENT_SECRET = "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"  # Votre secret client
GOOGLE_OAUTH_REDIRECT_URI = "http://localhost:3000/auth/google/callback"  # Doit correspondre à votre config Google Cloud
from django.core.management.utils import get_random_secret_key

# Configuration des JWT
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', get_random_secret_key())
JWT_REFRESH_SECRET_KEY = os.environ.get('JWT_REFRESH_SECRET_KEY', get_random_secret_key())

# Configuration de CORS pour permettre les cookies et les headers Authorization
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Définir les origines autorisées - en production, spécifiez les domaines exacts
CORS_ORIGIN_WHITELIST = [
    'http://localhost:3000',  # Votre frontend React
    # Ajoutez d'autres origines de production si nécessaire
]
import logging.config # Ajoutez cette ligne en haut du fichier si elle n'existe pas

# ... tout votre code settings.py existant ...

# AJOUTEZ CE BLOC DE CODE ICI, À LA FIN DE VOTRE FICHIER settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG', # <<< Ceci dit d'afficher les messages DEBUG et INFO en console
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': { # Optionnel, mais recommandé pour un fichier de log
            'level': 'DEBUG', # <<< Niveau pour le fichier de log
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'django_debug.log'), # Crée un fichier de log à la racine de votre projet
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': { # Pour les logs internes de Django
            'handlers': ['console'],
            'level': 'INFO', # Ou 'DEBUG' si vous voulez plus de logs Django
            'propagate': False,
        },
        'api': { # <<< TRÈS IMPORTANT : Cible votre application 'api'
            'handlers': ['console', 'file'], # Envoyer les logs à la console ET au fichier
            'level': 'DEBUG', # <<< CECI DIT D'AFFICHER TOUS LES LOGS DE VOTRE APP 'API'
            'propagate': False,
        },
        # Le logger '__main__' est utile pour les scripts ou les parties de code non rattachées à une app
        '__main__': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
    # Configuration pour le logger racine (catch-all)
    'root': {
        'handlers': ['console'],
        'level': 'INFO', # Ou 'DEBUG' pour plus de logs généraux
    }
}