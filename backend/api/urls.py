from django.urls import path
from .views import home, LoginView, RegisterView, ForgotPasswordView, ResetPasswordView, LogoutView, csrf_token_view  # Ajout de csrf_token_view

app_name = 'api'

urlpatterns = [
    path('api/csrf/', csrf_token_view, name='csrf_token'),
    path('login/', LoginView.as_view(), name='login'),
    path('signup/', RegisterView.as_view(), name='Signup'),
    path('home/', home, name='home'),
    path('forgot-password/', ForgotPasswordView, name='forgot_password'),
    path('reset-password/', ResetPasswordView, name='reset_password'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
