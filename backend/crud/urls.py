from django.contrib import admin
from django.urls import include, path
#from .views import CustomTokenObtainPairView
#from rest_framework_simplejwt.views import TokenRefreshView

from api.views import GoogleLogin  # Si tu as une vue pour la connexion via Google

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Routes pour l'authentification JWT
   
     #path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    #path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Routes pour Google et autres authentifications
    path('auth/', include('social_django.urls')),  # Authentification via social auth (par exemple, Google)
    path('api/google/', GoogleLogin.as_view(), name='google_login'),
    
    # Inclusion des URLs de l'application 'api' qui inclut l'inscription, le login, etc.
    path('api/', include('api.urls', namespace='api')),
    
     # Assurez-vous que c'est nécessaire
]
