from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    UserProfileView,
    DeleteUserView,
    DeleteUserByIdView,
    EsqueciSenhaView
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('profile/', UserProfileView.as_view()),
    path('delete/', DeleteUserView.as_view()),
    path('delete/<int:id>/', DeleteUserByIdView.as_view()),
    path('esqueci-senha/', EsqueciSenhaView.as_view()),
]