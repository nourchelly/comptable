from django.urls import path
from .views import home, LoginView, exporter_rapport,register_user,PasswordResetRequestView, reset_password,logout_view,google_auth_callback,get_csrf,ComptableProfileView,DeleteProfilView, RapportCreateView,RapportListView, RapportEditView, RapportDeleteView
  # Ajout de csrf_token_view
#from allauth.account.views import SignupView
from api.forms import CustomSignupForm
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
app_name = 'api'

urlpatterns = [
    #token
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # urls.py
     path("get-csrf/", get_csrf, name="get-csrf"),
    path('auth/google/callback/', google_auth_callback, name='google_callback'),
    #path('signup/', SignupView.as_view(form_class=CustomSignupForm)),
    #path('api/csrf/', csrf_token_view, name='csrf_token'),
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', register_user, name='Signup'),
    path('home/', home, name='home'),
    path('forgot-password/', PasswordResetRequestView.as_view(), name='forgot_password'),
    path('reset-password/', reset_password, name='reset_password'),
    
    path('logout/', logout_view, name='logout'),
    #comptable
    path('profil/', ComptableProfileView.as_view(), name='profilcomptable'),
    path('profil/delete/<str:user_id>', DeleteProfilView.as_view(), name='deletecomptable'),
    #rapports 
    path('rapports/', RapportListView.as_view(), name='rapport-list'),
    path('rapports/create/', RapportCreateView.as_view(), name='rapport-create'),
    path('rapports/<str:pk>/edit/', RapportEditView.as_view(), name='rapport-edit'),  # ✏️ Modifier un rapport
    path('rapports/<str:pk>/delete/', RapportDeleteView.as_view(), name='rapport-delete'),

    #path('rapports/<str:pk>', RapportDetailView.as_view(), name='detail_rapport'),
     path('rapports/<str:id>/export', exporter_rapport, name='exporter_rapport'),

]
