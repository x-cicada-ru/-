from django.urls import path
from .views import index

urlpatterns = [
    path('', index, name='index'),
    path('records/', index, name='records'),
    path('records/new/', index, name='record-new'),
    path('records/<int:pk>/edit/', index, name='record-edit'),
    path('references/', index, name='references'),
]
