# project_name/urls.py
from django.contrib import admin
from django.urls import include, path
from api import views
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')), 
       path('home/', views.home),
         path('login', views.LoginView),   # Inclure les URLs de l'application 'crud'
    # Ou inclure directement les URLs de l'application 'api' si vous préférez
    # path('api/', include('api.urls')),
]
