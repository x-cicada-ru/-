from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError


class Status(models.Model):
    name = models.CharField('Название', max_length=100, unique=True)
    color = models.CharField('Цвет', max_length=7, default='#ffffff',
                              help_text='HEX цвет для UI')
    is_active = models.BooleanField('Активен', default=True)
    sort_order = models.PositiveIntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        verbose_name = 'Статус'
        verbose_name_plural = 'Статусы'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class TransactionType(models.Model):
    name = models.CharField('Название', max_length=100, unique=True)
    code = models.CharField('Код', max_length=50, unique=True,
                            help_text='Уникальный код типа (income/expense)')
    icon = models.CharField('Иконка', max_length=50, blank=True)
    is_active = models.BooleanField('Активен', default=True)
    sort_order = models.PositiveIntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField('Создан', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлён', auto_now=True)

    class Meta:
        verbose_name = 'Тип операции'
        verbose_name_plural = 'Типы операций'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Category(models.Model):
    transaction_type = models.ForeignKey(
        TransactionType,
        on_delete=models.CASCADE,
        related_name='categories',
        verbose_name='Тип операции'
    )
    name = models.CharField('Название', max_length=100)
    color = models.CharField('Цвет', max_length=7, default='#888888')
    is_active = models.BooleanField('Активна', default=True)
    sort_order = models.PositiveIntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField('Создана', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлена', auto_now=True)

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        ordering = ['transaction_type__sort_order', 'sort_order', 'name']
        unique_together = [['transaction_type', 'name']]

    def __str__(self):
        return f"{self.transaction_type.name} → {self.name}"


class Subcategory(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='subcategories',
        verbose_name='Категория'
    )
    name = models.CharField('Название', max_length=100)
    color = models.CharField('Цвет', max_length=7, default='#aaaaaa')
    is_active = models.BooleanField('Активна', default=True)
    sort_order = models.PositiveIntegerField('Порядок сортировки', default=0)
    created_at = models.DateTimeField('Создана', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлена', auto_now=True)

    class Meta:
        verbose_name = 'Подкатегория'
        verbose_name_plural = 'Подкатегории'
        ordering = ['category__sort_order', 'sort_order', 'name']
        unique_together = [['category', 'name']]

    def __str__(self):
        return f"{self.category.name} → {self.name}"


class CashFlowRecord(models.Model):
    date = models.DateField(
        'Дата операции',
        help_text='Дата создания записи — заполняется автоматически, но может быть изменена вручную'
    )
    status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        related_name='records',
        verbose_name='Статус'
    )
    transaction_type = models.ForeignKey(
        TransactionType,
        on_delete=models.PROTECT,
        related_name='records',
        verbose_name='Тип'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='records',
        verbose_name='Категория'
    )
    subcategory = models.ForeignKey(
        Subcategory,
        on_delete=models.PROTECT,
        related_name='records',
        verbose_name='Подкатегория',
        blank=True,
        null=True
    )
    amount = models.DecimalField(
        'Сумма',
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    comment = models.TextField(
        'Комментарий',
        blank=True
    )
    created_at = models.DateTimeField('Создано', auto_now_add=True)
    updated_at = models.DateTimeField('Обновлено', auto_now=True)

    class Meta:
        verbose_name = 'Запись ДДС'
        verbose_name_plural = 'Записи ДДС'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['status']),
            models.Index(fields=['transaction_type']),
            models.Index(fields=['category']),
            models.Index(fields=['subcategory']),
            models.Index(fields=['-date', '-created_at']),
        ]

    def __str__(self):
        return f"{self.date.strftime('%d.%m.%Y')} | {self.transaction_type.name} | {self.amount:,.2f}₽"

    def clean(self):
        errors = {}
        if self.category and self.transaction_type:
            if self.category.transaction_type_id != self.transaction_type_id:
                errors['category'] = (
                    f'Категория "{self.category.name}" не относится к типу '
                    f'"{self.transaction_type.name}". '
                    f'Выберите категорию из списка, привязанного к данному типу.'
                )
        if self.subcategory and self.category:
            if self.subcategory.category_id != self.category_id:
                errors['subcategory'] = (
                    f'Подкатегория "{self.subcategory.name}" не принадлежит '
                    f'категории "{self.category.name}". '
                    f'Выберите подкатегорию из списка, привязанного к данной категории.'
                )
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
