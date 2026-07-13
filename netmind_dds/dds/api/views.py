from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as filters
from django.db.models import Sum, Count, Q
from django.utils import timezone

from ..models import Status, TransactionType, Category, Subcategory, CashFlowRecord
from .serializers import (
    StatusSerializer, TransactionTypeSerializer,
    CategorySerializer, SubcategorySerializer,
    CashFlowRecordSerializer, CashFlowRecordListSerializer
)


class CashFlowRecordFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = filters.DateFilter(field_name='date', lookup_expr='lte')
    status = filters.NumberFilter(field_name='status__id')
    transaction_type = filters.NumberFilter(field_name='transaction_type__id')
    category = filters.NumberFilter(field_name='category__id')
    subcategory = filters.NumberFilter(field_name='subcategory__id')
    search = filters.CharFilter(method='filter_search')

    class Meta:
        model = CashFlowRecord
        fields = ['date_from', 'date_to', 'status', 'transaction_type', 'category', 'subcategory']

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(comment__icontains=value) |
            Q(category__name__icontains=value) |
            Q(subcategory__name__icontains=value)
        )


class StatusViewSet(viewsets.ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer
    pagination_class = None


class TransactionTypeViewSet(viewsets.ModelViewSet):
    queryset = TransactionType.objects.all()
    serializer_class = TransactionTypeSerializer
    pagination_class = None


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related('transaction_type').all()
    serializer_class = CategorySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['transaction_type']


class SubcategoryViewSet(viewsets.ModelViewSet):
    queryset = Subcategory.objects.select_related('category').all()
    serializer_class = SubcategorySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category']


class CashFlowRecordViewSet(viewsets.ModelViewSet):
    queryset = CashFlowRecord.objects.select_related(
        'status', 'transaction_type', 'category', 'subcategory'
    ).all()
    serializer_class = CashFlowRecordSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = CashFlowRecordFilter
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CashFlowRecordListSerializer
        return CashFlowRecordSerializer


@api_view(['GET'])
def categories_by_type(request, type_id):
    categories = Category.objects.filter(
        transaction_type_id=type_id,
        is_active=True
    ).values('id', 'name', 'color')
    return Response(list(categories))


@api_view(['GET'])
def subcategories_by_category(request, category_id):
    subcategories = Subcategory.objects.filter(
        category_id=category_id,
        is_active=True
    ).values('id', 'name', 'color')
    return Response(list(subcategories))


@api_view(['GET'])
def dashboard_stats(request):
    today = timezone.now().date()
    month_start = today.replace(day=1)
    total_records = CashFlowRecord.objects.count()

    income_total = CashFlowRecord.objects.filter(
        transaction_type__code='income'
    ).aggregate(total=Sum('amount'))['total'] or 0

    expense_total = CashFlowRecord.objects.filter(
        transaction_type__code='expense'
    ).aggregate(total=Sum('amount'))['total'] or 0

    month_income = CashFlowRecord.objects.filter(
        transaction_type__code='income',
        date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0

    month_expense = CashFlowRecord.objects.filter(
        transaction_type__code='expense',
        date__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0

    status_stats = CashFlowRecord.objects.values(
        'status__name', 'status__color'
    ).annotate(
        count=Count('id'),
        total=Sum('amount')
    ).order_by('-total')

    recent = CashFlowRecord.objects.select_related(
        'status', 'transaction_type', 'category', 'subcategory'
    ).order_by('-date', '-created_at')[:5]

    return Response({
        'total_records': total_records,
        'balance': float(income_total - expense_total),
        'income_total': float(income_total),
        'expense_total': float(expense_total),
        'month_income': float(month_income),
        'month_expense': float(month_expense),
        'status_stats': list(status_stats),
        'recent_records': CashFlowRecordListSerializer(recent, many=True).data
    })
