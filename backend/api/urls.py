from django.urls import path
#from .views import CustomTokenObtainPairView
#from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    home,
    ProfilAdminApi,
    ProfilComptableApi,

    login_view,
    GoogleLogin,
    register_user,
    PasswordResetRequestView,
    reset_password,
    logout_view,
    google_auth_callback,
    get_csrf,
     # Si tu veux garder cette vue spécifique
    ComptableProfileView,
    DeleteProfilView,
    RapportListView,
    RapportEditView,
    RapportDeleteView,
    create_rapport,
    exporter_rapport
)

app_name = 'api'

urlpatterns = [
    # Authentification et gestion des comptes
    path('login/', login_view, name='login'),
    path('signup/', register_user, name='signup'),
    path('home/', home, name='home'),
    path('forgot-password/', PasswordResetRequestView.as_view(), name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('logout/', logout_view, name='logout'),
    
    # Authentification via Google
    path('auth/google/callback/', google_auth_callback, name='google_callback'),
    path("get-csrf/", get_csrf, name="get-csrf"),
    
    # Gestion des profils et rapports
    path('profil/', ComptableProfileView.as_view(), name='profilcomptable'),
    path('profil/delete/<str:user_id>', DeleteProfilView.as_view(), name='deletecomptable'),
    path('rapports/', RapportListView.as_view(), name='rapport-list'),
    path('rapports/create/', create_rapport, name='rapport-create'),
    path('rapports/<str:pk>/edit/', RapportEditView.as_view(), name='rapport-edit'),  # ✏️ Modifier un rapport
    path('rapports/<str:pk>/delete/', RapportDeleteView.as_view(), name='rapport-delete'),
    path('rapports/<str:id>/export', exporter_rapport, name='exporter_rapport'),
    
    # Vue personnalisée pour rafraîchir le token (si tu la veux encore)
    path('google/login/', GoogleLogin.as_view(), name='google_login'),

     #path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    #path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profiladmin/', ProfilAdminApi, name='profiladmin-list'),
    path('profiladmin/<str:id>/', ProfilAdminApi, name='profiladmin-detail'),
    path('profilcomptable/', ProfilComptableApi, name='profilcomptable-list'),
    path('profilcomptable/<str:id>/', ProfilComptableApi, name='profilcomptable-detail'),
   
   
   
   
    #path('token/refresh/', refresh_token_view, name='refresh_token'),
]
