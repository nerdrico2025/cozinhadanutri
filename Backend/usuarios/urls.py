from django.urls import path
from .views import (
    RegisterView, LoginView, UserProfileView, DeleteUserView, DeleteUserByIdView, LogoutView,
    request_password_reset, validate_reset_code, reset_password,
    AdminUserListView, AdminUpdateUserView
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('logout/', LogoutView.as_view()),
    path('profile/', UserProfileView.as_view()),
    path('delete/', DeleteUserView.as_view()),
    path('delete/<int:id>/', DeleteUserByIdView.as_view()),
    path('password-reset/request/', request_password_reset),
    path('password-reset/validate/', validate_reset_code),
    path('password-reset/confirm/', reset_password),
    
    # Admin
    path('admin/users/', AdminUserListView.as_view()),
    path('admin/users/<int:pk>/', AdminUpdateUserView.as_view()),
]