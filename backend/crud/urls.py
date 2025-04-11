# project_name/urls.py
from django.contrib import admin
from django.urls import include, path

from api.views import GoogleLogin


urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('social_django.urls')), 
    path('accounts/' , include("allauth.urls")),
    path('api/google/' , GoogleLogin.as_view() , name='google_login'),
    # urls.py
   
    path('api/', include('api.urls')), 

  

    path('api/comptable/', include('comptable.urls')),
    
    path('directeur/', include('directeur.urls')),
     
    path('admin/', include('admin_app.urls')),
   # Inclure les URLs de l'application 'crud'
    # Ou inclure directement les URLs de l'application 'api' si vous préférez
    # path('api/', include('api.urls')),
]
