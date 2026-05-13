from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import FichaTecnica
from .serializers import FichaTecnicaSerializer


class FichaTecnicaViewSet(viewsets.ModelViewSet):
    queryset = FichaTecnica.objects.all()
    serializer_class = FichaTecnicaSerializer
    permission_classes = [IsAuthenticated]