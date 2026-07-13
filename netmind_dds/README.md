# NetMind DDS — Движение денежных средств

Веб-приложение для учёта, управления и анализа поступлений и списаний денежных средств.
Реализовано в стиле **NetMind** — тёмная тема, минималистичный UI, каскадные dropdown'ы.

## Быстрый старт

### 1. Установка зависимостей

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Настройка базы данных

```bash
python manage.py migrate
python manage.py init_data
python manage.py createsuperuser
```

### 3. Запуск

```bash
python manage.py runserver
```

Откройте в браузере: **http://127.0.0.1:8000/**  
Django Admin: **http://127.0.0.1:8000/admin/**

## Функционал

### Записи ДДС
- Создание, редактирование, удаление записей
- Дата операции (автозаполнение, редактируемая)
- Статус (Бизнес / Личное / Налог — расширяемый справочник)
- Тип (Пополнение / Списание — расширяемый справочник)
- Категории и подкатегории с цветовой индикацией
- Сумма в рублях
- Комментарий (опционально)

### Фильтрация
- По дате (период от/до)
- По статусу
- По типу
- По категории
- По подкатегории
- Пагинация

### Управление справочниками
- CRUD для статусов
- CRUD для типов операций
- CRUD для категорий (с привязкой к типу)
- CRUD для подкатегорий (с привязкой к категории)

### Логические зависимости
- Категории фильтруются по выбранному типу
- Подкатегории фильтруются по выбранной категории
- Валидация на клиенте и сервере
- Нельзя выбрать категорию, не связанную с типом
- Нельзя выбрать подкатегорию, не связанную с категорией

### Дашборд
- Общий баланс
- Сумма поступлений и списаний
- Статистика по статусам
- Последние операции

## Архитектура

```
netmind_dds/
├── netmind_dds/          # Django settings, URLs, WSGI
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── dds/                   # Основное приложение
│   ├── models.py          # Модели: Status, TransactionType, Category, Subcategory, CashFlowRecord
│   ├── admin.py           # Django Admin
│   ├── views.py           # View для SPA
│   ├── urls.py            # URL routing
│   ├── api/
│   │   ├── serializers.py # DRF Serializers
│   │   ├── views.py       # DRF ViewSets + кастомные endpoints
│   │   └── urls.py        # API Router
│   ├── management/
│   │   └── commands/
│   │       └── init_data.py  # Команда начальных данных
│   ├── static/dds/
│   │   ├── css/styles.css   # NetMind-style CSS
│   │   └── js/app.js        # SPA JavaScript
│   └── templates/dds/
│       └── index.html       # Главный шаблон SPA
├── db.sqlite3             # SQLite база данных
├── requirements.txt       # Зависимости
├── manage.py
└── README.md
```

## Технологии

| Компонент | Технология |
|-----------|-----------|
| Backend | Python 3.11+, Django 5.x |
| API | Django REST Framework 3.15+ |
| База данных | SQLite (по умолчанию) |
| Фильтрация | django-filter |
| CORS | django-cors-headers |
| Frontend | Vanilla JavaScript (SPA) |
| Стили | CSS3 (тёмная тема в стиле NetMind) |

## API Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/records/` | GET, POST | Список / создание записей |
| `/api/records/<id>/` | GET, PATCH, DELETE | Детали / обновление / удаление |
| `/api/statuses/` | GET, POST | Справочник статусов |
| `/api/types/` | GET, POST | Справочник типов |
| `/api/categories/` | GET, POST | Справочник категорий |
| `/api/subcategories/` | GET, POST | Справочник подкатегорий |
| `/api/categories/by-type/<id>/` | GET | Категории по типу |
| `/api/subcategories/by-category/<id>/` | GET | Подкатегории по категории |
| `/api/dashboard/stats/` | GET | Статистика дашборда |

## UI/UX

- Тёмная тема в стиле NetMind
- Анимации плавных переходов
- Каскадные dropdown'ы с валидацией зависимостей
- Toast-уведомления вместо alert
- Модальные окна для форм
- Адаптивная таблица с сортировкой
- Карточки статистики на дашборде

## Примечания

- Для production замените `SECRET_KEY` в `settings.py`
- Для production отключите `DEBUG = True` и `CORS_ALLOW_ALL_ORIGINS = True`
- Для production рекомендуется PostgreSQL вместо SQLite
