from django.urls import path
from .views import home, LoginView, register_user,PasswordResetRequestView, reset_password,logout_view,google_auth_callback,get_csrf
  # Ajout de csrf_token_view
#from allauth.account.views import SignupView
from api.forms import CustomSignupForm
from . import views
app_name = 'api'

urlpatterns = [
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
]
