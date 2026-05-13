from rest_framework.routers import DefaultRouter
from .views import FichaTecnicaViewSet

router = DefaultRouter()
router.register(r'fichas', FichaTecnicaViewSet)

urlpatterns = router.urls