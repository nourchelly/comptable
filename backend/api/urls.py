from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
#from .views import CustomTokenObtainPairView
#from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    search_users,
    user_stats,
    users_stats,
    home,
    ProfilAdminApi,
    ProfilComptableApi,
    ProfilDirecteurApi,
    AuditApi,
    CompteApi,
    ListeComptes,
    releve_api,
    download_releve,
    SignalerCompte,
    activate_account,
    AdminActionsApi,
     MesActionsApi,facture_api, download_facture,#serve_facture_file, 
    login_view,
    GoogleLogin,
    register_user,
    PasswordResetRequestView,
    facebook_auth_callback,
    reset_password,
    logout_view,
    google_auth_callback,
    get_csrf,
     # Si tu veux garder cette vue spécifique
    ComptableProfileView,
    DeleteProfilView,
   api_rapports,
   mes_notifications,
   get_unread_count,
   mark_all_notifications_read,
   mark_notification_read,
   delete_notification
)

app_name = 'api'

urlpatterns = [
    # Authentification et gestion des comptes
    path('login/', login_view, name='login'),
    path('signup/', register_user, name='signup'),
    path('activate/<str:token>/', activate_account, name='activate'),
    path('home/', home, name='home'),
    path('forgot-password/', PasswordResetRequestView.as_view(), name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    path('logout/', logout_view, name='logout'),
    
    # Authentification via Google
    path('auth/google/callback/', google_auth_callback, name='google_callback'),
    path("get-csrf/", get_csrf, name="get-csrf"),
    path('auth/facebook/callback/', facebook_auth_callback, name='google_callback'),
    # Gestion des profils et rapports
    path('profil/', ComptableProfileView.as_view(), name='profilcomptable'),
    path('profil/delete/<str:user_id>', DeleteProfilView.as_view(), name='deletecomptable'),
    path('rapports/', api_rapports, name='rapport-list'),
    path('rapports/<str:id>/', api_rapports, name='rapport-detail'),  # ✏️ Modifier un rapport
   
    
    # Vue personnalisée pour rafraîchir le token (si tu la veux encore)
    path('google/login/', GoogleLogin.as_view(), name='google_login'),

     #path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    #path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profiladmin/', ProfilAdminApi, name='profiladmin-list'),
    path('profiladmin/<str:id>/', ProfilAdminApi, name='profiladmin-detail'),
    path('profilcomptable/', ProfilComptableApi, name='profilcomptable-list'),
    path('profilcomptable/<str:id>/', ProfilComptableApi, name='profilcomptable-detail'),
    path('profildirecteur/', ProfilDirecteurApi, name='profildirecteur-list'),
    path('profildirecteur/<str:id>/', ProfilDirecteurApi, name='profildirecteur-detail'),
   
   #path audit
    path('audit/', AuditApi, name='audit-list'),
    path('audit/<str:id>/', AuditApi, name='audit-detail'),
   
    path('compte/<str:id>/', CompteApi, name='compte_api'),
    path('comptes/', ListeComptes, name='liste_comptes'),
    path('signaler-compte/', SignalerCompte, name='signaler_compte'),
    path('actions/', AdminActionsApi, name='directeur_actions'),
    path('mes-actions/', MesActionsApi, name='mes_actions'),
    
    #factures 
    path('factures/', facture_api, name='facture-api'),
    path('factures/<str:id>/', facture_api, name='facture-detail'),
    path('factures/<str:id>/download/', download_facture, name='download_facture'),
    path('banques/', releve_api, name='releve-api'),
    path('banques/<str:id>/', releve_api, name='releve-detail'),
    path('banques/<str:id>/download/', download_releve, name='download_releve'),

    # Notifications - adaptées au composant React existant
    path('notifications/', mes_notifications, name='get_notifications'),
    path('notifications/unread-count/', get_unread_count, name='get_unread_count'),
    path('notifications/read-all/', mark_all_notifications_read, name='mark_all_notifications_read'),
    path('notifications/<str:notification_id>/read/', mark_notification_read, name='mark_notification_read'),
    path('notifications/<str:notification_id>/', delete_notification, name='delete_notification'),
    path('user-stats/', user_stats, name='user_stats'),
     path('users-stats/', users_stats, name='users_stats'),
    path('search/', search_users, name='search_users'),
   # path('media/<path:file_path>', serve_facture_file, name='serve_facture_file'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
   

