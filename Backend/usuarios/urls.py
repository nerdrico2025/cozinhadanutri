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
    TrocarPlanoView,
    AdminUsersView,
    AdminActivitiesView,
    FAQView,
    SupportConfigView,
    ConsultaCNPJView,
    PaymentPreferenceView,
    PaymentStatusView,
    UpdateProfileView,
    LogoutView, 
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
    
    path(
    'admin/users/',
    AdminUsersView.as_view()
    ),
    path(
    'admin/activities/',
    AdminActivitiesView.as_view()
    ),
    path(
        'faq/',
        FAQView.as_view()
    ),

    path(
    'support-config/',
    SupportConfigView.as_view()
    ),

    path(
    'cnpj/<str:cnpj>/',
    ConsultaCNPJView.as_view()
    ),
    path(
    'payments/preference/',
    PaymentPreferenceView.as_view()
    ),

    path(
    'payments/status/<int:id>/',
    PaymentStatusView.as_view()
    ),

    path(
    'profile/update/',
    UpdateProfileView.as_view()
    ),

    path(
    'profile/update/',
    UpdateProfileView.as_view()
    ),

    path(
    'logout/',
    LogoutView.as_view()
    ),







]