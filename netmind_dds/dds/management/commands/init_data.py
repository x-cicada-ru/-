from django.core.management.base import BaseCommand
from dds.models import Status, TransactionType, Category, Subcategory


class Command(BaseCommand):
    help = 'Initialize reference data for DDS'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.NOTICE('Creating initial data...'))

        statuses = [
            {'name': 'Бизнес', 'color': '#6366f1', 'sort_order': 1},
            {'name': 'Личное', 'color': '#f59e0b', 'sort_order': 2},
            {'name': 'Налог', 'color': '#ef4444', 'sort_order': 3},
        ]
        for s in statuses:
            Status.objects.get_or_create(name=s['name'], defaults=s)
        self.stdout.write(self.style.SUCCESS(f'  {chr(10003)} Statuses: {len(statuses)}'))

        types = [
            {'name': 'Пополнение', 'code': 'income', 'icon': 'arrow-up', 'sort_order': 1},
            {'name': 'Списание', 'code': 'expense', 'icon': 'arrow-down', 'sort_order': 2},
        ]
        for t in types:
            TransactionType.objects.get_or_create(code=t['code'], defaults=t)
        self.stdout.write(self.style.SUCCESS(f'  {chr(10003)} Types: {len(types)}'))

        income_type = TransactionType.objects.get(code='income')
        expense_type = TransactionType.objects.get(code='expense')

        categories_data = [
            {'name': 'Зарплата', 'transaction_type': income_type, 'color': '#4ade80', 'sort_order': 1},
            {'name': 'Инвестиции', 'transaction_type': income_type, 'color': '#60a5fa', 'sort_order': 2},
            {'name': 'Фриланс', 'transaction_type': income_type, 'color': '#a78bfa', 'sort_order': 3},
            {'name': 'Прочее', 'transaction_type': income_type, 'color': '#94a3b8', 'sort_order': 4},
            {'name': 'Инфраструктура', 'transaction_type': expense_type, 'color': '#f87171', 'sort_order': 5},
            {'name': 'Маркетинг', 'transaction_type': expense_type, 'color': '#fb923c', 'sort_order': 6},
            {'name': 'Офис', 'transaction_type': expense_type, 'color': '#fbbf24', 'sort_order': 7},
            {'name': 'Персонал', 'transaction_type': expense_type, 'color': '#c084fc', 'sort_order': 8},
        ]
        for c in categories_data:
            Category.objects.get_or_create(
                name=c['name'],
                transaction_type=c['transaction_type'],
                defaults=c
            )
        self.stdout.write(self.style.SUCCESS(f'  {chr(10003)} Categories: {len(categories_data)}'))

        subcategories_data = [
            {'name': 'VPS', 'category': 'Инфраструктура', 'color': '#fca5a5', 'sort_order': 1},
            {'name': 'Proxy', 'category': 'Инфраструктура', 'color': '#fdba74', 'sort_order': 2},
            {'name': 'Домен', 'category': 'Инфраструктура', 'color': '#fcd34d', 'sort_order': 3},
            {'name': 'SSL', 'category': 'Инфраструктура', 'color': '#fde047', 'sort_order': 4},
            {'name': 'Farpost', 'category': 'Маркетинг', 'color': '#fed7aa', 'sort_order': 5},
            {'name': 'Avito', 'category': 'Маркетинг', 'color': '#fbcfe8', 'sort_order': 6},
            {'name': 'Яндекс.Директ', 'category': 'Маркетинг', 'color': '#ddd6fe', 'sort_order': 7},
            {'name': 'VK Реклама', 'category': 'Маркетинг', 'color': '#e9d5ff', 'sort_order': 8},
            {'name': 'Аренда', 'category': 'Офис', 'color': '#bfdbfe', 'sort_order': 9},
            {'name': 'Коммунальные', 'category': 'Офис', 'color': '#c7d2fe', 'sort_order': 10},
            {'name': 'Канцелярия', 'category': 'Офис', 'color': '#fbcfe8', 'sort_order': 11},
            {'name': 'Зарплата', 'category': 'Персонал', 'color': '#e9d5ff', 'sort_order': 12},
            {'name': 'Премии', 'category': 'Персонал', 'color': '#f5d0fe', 'sort_order': 13},
            {'name': 'Основная', 'category': 'Зарплата', 'color': '#bbf7d0', 'sort_order': 14},
            {'name': 'Премия', 'category': 'Зарплата', 'color': '#86efac', 'sort_order': 15},
            {'name': 'Дивиденды', 'category': 'Инвестиции', 'color': '#93c5fd', 'sort_order': 16},
            {'name': 'Проценты', 'category': 'Инвестиции', 'color': '#a5b4fc', 'sort_order': 17},
        ]

        for s in subcategories_data:
            cat = Category.objects.get(name=s['category'])
            Subcategory.objects.get_or_create(
                name=s['name'],
                category=cat,
                defaults={**s, 'category': cat}
            )
        self.stdout.write(self.style.SUCCESS(f'  {chr(10003)} Subcategories: {len(subcategories_data)}'))

        self.stdout.write(self.style.SUCCESS(f'\n{chr(10004)} Initial data created successfully!'))
