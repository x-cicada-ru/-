from rest_framework import serializers
from ..models import Status, TransactionType, Category, Subcategory, CashFlowRecord


class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'name', 'color', 'is_active', 'sort_order']


class TransactionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionType
        fields = ['id', 'name', 'code', 'icon', 'is_active', 'sort_order']


class CategorySerializer(serializers.ModelSerializer):
    transaction_type_name = serializers.CharField(source='transaction_type.name', read_only=True)
    transaction_type_id = serializers.IntegerField(source='transaction_type.id', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'transaction_type', 'transaction_type_id', 'transaction_type_name',
                  'color', 'is_active', 'sort_order']


class SubcategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True)
    transaction_type_id = serializers.IntegerField(source='category.transaction_type.id', read_only=True)

    class Meta:
        model = Subcategory
        fields = ['id', 'name', 'category', 'category_id', 'category_name',
                  'transaction_type_id', 'color', 'is_active', 'sort_order']


class CashFlowRecordSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.name', read_only=True)
    status_color = serializers.CharField(source='status.color', read_only=True)
    transaction_type_name = serializers.CharField(source='transaction_type.name', read_only=True)
    transaction_type_code = serializers.CharField(source='transaction_type.code', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)

    class Meta:
        model = CashFlowRecord
        fields = [
            'id', 'date', 'status', 'status_name', 'status_color',
            'transaction_type', 'transaction_type_name', 'transaction_type_code',
            'category', 'category_name',
            'subcategory', 'subcategory_name',
            'amount', 'comment',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        category = data.get('category')
        transaction_type = data.get('transaction_type')
        subcategory = data.get('subcategory')

        if category and transaction_type:
            if category.transaction_type_id != transaction_type.id:
                raise serializers.ValidationError({
                    'category': f'Категория "{category.name}" не относится к типу "{transaction_type.name}"'
                })

        if subcategory and category:
            if subcategory.category_id != category.id:
                raise serializers.ValidationError({
                    'subcategory': f'Подкатегория "{subcategory.name}" не принадлежит категории "{category.name}"'
                })

        return data

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError('Сумма должна быть больше 0')
        return value


class CashFlowRecordListSerializer(serializers.ModelSerializer):
    status_name = serializers.CharField(source='status.name', read_only=True)
    status_color = serializers.CharField(source='status.color', read_only=True)
    transaction_type_name = serializers.CharField(source='transaction_type.name', read_only=True)
    transaction_type_code = serializers.CharField(source='transaction_type.code', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    subcategory_name = serializers.CharField(source='subcategory.name', read_only=True)

    class Meta:
        model = CashFlowRecord
        fields = [
            'id', 'date', 'status', 'status_name', 'status_color',
            'transaction_type', 'transaction_type_name', 'transaction_type_code',
            'category', 'category_name',
            'subcategory', 'subcategory_name',
            'amount', 'comment'
        ]
