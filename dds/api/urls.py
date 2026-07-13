from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    StatusViewSet, TransactionTypeViewSet,
    CategoryViewSet, SubcategoryViewSet,
    CashFlowRecordViewSet,
    categories_by_type, subcategories_by_category,
    dashboard_stats
)

router = DefaultRouter()
router.register(r'statuses', StatusViewSet, basename='status')
router.register(r'types', TransactionTypeViewSet, basename='type')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subcategories', SubcategoryViewSet, basename='subcategory')
router.register(r'records', CashFlowRecordViewSet, basename='record')

urlpatterns = [
    path('', include(router.urls)),
    path('categories/by-type/<int:type_id>/', categories_by_type, name='categories-by-type'),
    path('subcategories/by-category/<int:category_id>/', subcategories_by_category, name='subcategories-by-category'),
    path('dashboard/stats/', dashboard_stats, name='dashboard-stats'),
]
