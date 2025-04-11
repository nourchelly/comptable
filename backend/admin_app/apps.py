# admin_app/apps.py
from django.apps import AppConfig

class AdminAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_app'  # Doit correspondre au nom du dossier