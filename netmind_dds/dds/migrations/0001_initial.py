from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Status',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Название')),
                ('color', models.CharField(default='#ffffff', help_text='HEX цвет для UI', max_length=7, verbose_name='Цвет')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создан')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлён')),
            ],
            options={
                'verbose_name': 'Статус',
                'verbose_name_plural': 'Статусы',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='TransactionType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Название')),
                ('code', models.CharField(help_text='Уникальный код типа (income/expense)', max_length=50, unique=True, verbose_name='Код')),
                ('icon', models.CharField(blank=True, max_length=50, verbose_name='Иконка')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активен')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создан')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлён')),
            ],
            options={
                'verbose_name': 'Тип операции',
                'verbose_name_plural': 'Типы операций',
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Название')),
                ('color', models.CharField(default='#888888', max_length=7, verbose_name='Цвет')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активна')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создана')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлена')),
                ('transaction_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='categories', to='dds.transactiontype', verbose_name='Тип операции')),
            ],
            options={
                'verbose_name': 'Категория',
                'verbose_name_plural': 'Категории',
                'ordering': ['transaction_type__sort_order', 'sort_order', 'name'],
                'unique_together': {('transaction_type', 'name')},
            },
        ),
        migrations.CreateModel(
            name='Subcategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='Название')),
                ('color', models.CharField(default='#aaaaaa', max_length=7, verbose_name='Цвет')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активна')),
                ('sort_order', models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создана')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлена')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='subcategories', to='dds.category', verbose_name='Категория')),
            ],
            options={
                'verbose_name': 'Подкатегория',
                'verbose_name_plural': 'Подкатегории',
                'ordering': ['category__sort_order', 'sort_order', 'name'],
                'unique_together': {('category', 'name')},
            },
        ),
        migrations.CreateModel(
            name='CashFlowRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(help_text='Дата создания записи — заполняется автоматически, но может быть изменена вручную', verbose_name='Дата операции')),
                ('amount', models.DecimalField(decimal_places=2, help_text='Количество средств в рублях, например, 1000₽', max_digits=15, validators=[django.core.validators.MinValueValidator(0.01)], verbose_name='Сумма')),
                ('comment', models.TextField(blank=True, help_text='Комментарий к записи в свободной форме (необязательно)', verbose_name='Комментарий')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Создано')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Обновлено')),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='records', to='dds.category', verbose_name='Категория')),
                ('status', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='records', to='dds.status', verbose_name='Статус')),
                ('subcategory', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name='records', to='dds.subcategory', verbose_name='Подкатегория')),
                ('transaction_type', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='records', to='dds.transactiontype', verbose_name='Тип')),
            ],
            options={
                'verbose_name': 'Запись ДДС',
                'verbose_name_plural': 'Записи ДДС',
                'ordering': ['-date', '-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='cashflowrecord',
            index=models.Index(fields=['date'], name='dds_cashflo_date_5c8c8e_idx'),
        ),
        migrations.AddIndex(
            model_name='cashflowrecord',
            index=models.Index(fields=['status'], name='dds_cashflo_status_7f8c8e_idx'),
        ),
        migrations.AddIndex(
            model_name='cashflowrecord',
            index=models.Index(fields=['transaction_type'], name='dds_cashflo_transac_8f8c8e_idx'),
        ),
        migrations.AddIndex(
            model_name='cashflowrecord',
            index=models.Index(fields=['category'], name='dds_cashflo_categor_9f8c8e_idx'),
        ),
        migrations.AddIndex(
            model_name='cashflowrecord',
            index=models.Index(fields=['subcategory'], name='dds_cashflo_subcate_af8c8e_idx'),
        ),
        migrations.AddIndex(
            model_name='cashflowrecord',
            index=models.Index(fields=['-date', '-created_at'], name='dds_cashflo_date_0f8c8e_idx'),
        ),
    ]
