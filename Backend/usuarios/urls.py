from django.urls import path

from .views import (
    teste,
    RegisterView,
    LoginView,
    UserProfileView,
    DeleteUserView,
    DeleteUserByIdView,
    EsqueciSenhaView,
    MeuPlanoView,
    TrocarPlanoView
)

urlpatterns = [

    path('', teste),

    path(
        'register/',
        RegisterView.as_view()
    ),

    path(
        'login/',
        LoginView.as_view()
    ),

    path(
        'profile/',
        UserProfileView.as_view()
    ),

    path(
        'delete/',
        DeleteUserView.as_view()
    ),

    path(
        'delete/<int:id>/',
        DeleteUserByIdView.as_view()
    ),

    path(
        'password-reset/',
        EsqueciSenhaView.as_view()
    ),

    path(
        'meu-plano/',
        MeuPlanoView.as_view()
    ),

    path(
        'trocar-plano/',
        TrocarPlanoView.as_view()
    ),
]