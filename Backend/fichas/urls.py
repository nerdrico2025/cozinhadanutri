from django.urls import path

from .views import (
    TabelaNutricionalView,
    RotuloView,
    ConfiguracaoEtiquetaView,
    EtiquetaView,
)

urlpatterns = [
    path(
        'fichas-tecnicas/<int:id>/tabela-nutricional/',
        TabelaNutricionalView.as_view(),
        name='tabela-nutricional'
    ),

    path(
        'fichas-tecnicas/<int:id>/rotulo/',
        RotuloView.as_view(),
        name='rotulo'
    ),

    path(
        'fichas-tecnicas/<int:id>/configuracao-etiqueta/',
        ConfiguracaoEtiquetaView.as_view(),
        name='configuracao-etiqueta'
    ),

    path(
        'etiquetas/<int:id>/',
        EtiquetaView.as_view(),
        name='etiqueta'
    ),
]