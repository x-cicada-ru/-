from django.contrib import admin
from django.utils.html import format_html
from .models import Status, TransactionType, Category, Subcategory, CashFlowRecord


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_preview', 'is_active', 'sort_order', 'created_at']
    list_editable = ['is_active', 'sort_order']
    search_fields = ['name']
    ordering = ['sort_order', 'name']

    def color_preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:14px;height:14px;'
            'border-radius:3px;background:{};margin-right:6px;vertical-align:middle;"></span>{}',
            obj.color, obj.color
        )
    color_preview.short_description = 'Цвет'


@admin.register(TransactionType)
class TransactionTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'icon', 'is_active', 'sort_order']
    list_editable = ['is_active', 'sort_order']
    search_fields = ['name', 'code']
    ordering = ['sort_order', 'name']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'transaction_type', 'color_preview', 'is_active', 'sort_order']
    list_editable = ['is_active', 'sort_order']
    list_filter = ['transaction_type', 'is_active']
    search_fields = ['name', 'transaction_type__name']
    ordering = ['transaction_type__sort_order', 'sort_order', 'name']

    def color_preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:14px;height:14px;'
            'border-radius:3px;background:{};margin-right:6px;vertical-align:middle;"></span>{}',
            obj.color, obj.color
        )
    color_preview.short_description = 'Цвет'


@admin.register(Subcategory)
class SubcategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'color_preview', 'is_active', 'sort_order']
    list_editable = ['is_active', 'sort_order']
    list_filter = ['category__transaction_type', 'category', 'is_active']
    search_fields = ['name', 'category__name']
    ordering = ['category__sort_order', 'sort_order', 'name']

    def color_preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:14px;height:14px;'
            'border-radius:3px;background:{};margin-right:6px;vertical-align:middle;"></span>{}',
            obj.color, obj.color
        )
    color_preview.short_description = 'Цвет'


@admin.register(CashFlowRecord)
class CashFlowRecordAdmin(admin.ModelAdmin):
    list_display = ['date', 'status', 'transaction_type', 'category', 'subcategory',
                    'amount_formatted', 'comment_preview', 'created_at']
    list_filter = ['date', 'status', 'transaction_type', 'category', 'subcategory']
    search_fields = ['comment', 'category__name', 'subcategory__name']
    date_hierarchy = 'date'
    ordering = ['-date', '-created_at']

    def amount_formatted(self, obj):
        color = '#4ade50' if obj.transaction_type.code == 'income' else '#f87171'
        sign = '+' if obj.transaction_type.code == 'income' else '-'
        return format_html(
            '<span style="color:{};font-weight:600;">{}{:,.2f} ₽</span>',
            color, sign, obj.amount
        )
    amount_formatted.short_description = 'Сумма'

    def comment_preview(self, obj):
        return obj.comment[:60] + '...' if len(obj.comment) > 60 else obj.comment
    comment_preview.short_description = 'Комментарий'
