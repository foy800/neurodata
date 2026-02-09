# Настройка Turso для проекта

## Что такое Turso?

Turso - это распределенная база данных на основе libSQL (форк SQLite), оптимизированная для работы в облачной среде, включая Vercel. Она предоставляет глобально распределенную, высокопроизводительную базу данных с низкой задержкой.

## Шаги по настройке Turso

### 1. Создание аккаунта Turso

1. Перейдите на [turso.tech](https://turso.tech) и зарегистрируйтесь
2. После регистрации вы получите доступ к панели управления Turso

### 2. Установка CLI Turso

```bash
# Установка CLI Turso для Windows через PowerShell
iwr https://get.turso.tech/install.ps1 -useb | iex
```

### 3. Аутентификация в CLI

```bash
turso auth login
```

### 4. Создание базы данных

```bash
# Создание новой базы данных
turso db create neuro-knowledge-base

# Получение URL базы данных
turso db show neuro-knowledge-base --url

# Создание токена аутентификации
turso db tokens create neuro-knowledge-base
```

### 5. Настройка переменных окружения

Обновите файл `.env` в корне проекта:

```
# Turso Database Configuration
TURSO_DATABASE_URL="libsql://your-database-name.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# Session Secret
SESSION_SECRET="neuro-knowledge-base-secret-key-2024-production"

# Environment
NODE_ENV="development"
```

Замените `your-database-name.turso.io` на URL вашей базы данных и `your-auth-token` на созданный токен аутентификации.

### 6. Настройка переменных окружения в Vercel

1. Перейдите в настройки вашего проекта на Vercel
2. Добавьте следующие переменные окружения:
   - `TURSO_DATABASE_URL`: URL вашей базы данных Turso
   - `TURSO_AUTH_TOKEN`: Токен аутентификации Turso
   - `SESSION_SECRET`: Секретный ключ для сессий
   - `NODE_ENV`: `production`

### 7. Инициализация базы данных

При первом запуске приложения база данных будет автоматически инициализирована с необходимыми таблицами и начальными данными.

## Структура базы данных

База данных содержит следующие таблицы:

1. **users** - Пользователи системы
   - id: Уникальный идентификатор
   - username: Имя пользователя
   - password: Хешированный пароль
   - email: Email пользователя
   - full_name: Полное имя
   - avatar: Путь к аватару
   - is_blocked: Флаг блокировки
   - is_admin: Флаг администратора
   - created_at: Дата создания

2. **categories** - Категории материалов
   - id: Уникальный идентификатор
   - name: Название категории
   - description: Описание категории
   - created_at: Дата создания

3. **materials** - Материалы
   - id: Уникальный идентификатор
   - category_id: ID категории
   - title: Заголовок материала
   - content: Содержимое материала
   - author_id: ID автора
   - created_at: Дата создания
   - updated_at: Дата обновления

4. **messages** - Сообщения между пользователями
   - id: Уникальный идентификатор
   - sender_id: ID отправителя
   - receiver_id: ID получателя
   - message: Текст сообщения
   - is_read: Флаг прочтения
   - created_at: Дата создания

## Учетные данные администратора

По умолчанию создается учетная запись администратора:

- Логин: `admin`
- Пароль: `123456789`

## Отладка

Для отладки подключения к базе данных Turso можно использовать следующие маршруты:

- `/debug/status` - Проверка состояния сервера
- `/debug/db-check` - Проверка базы данных
- `/debug/create-admin` - Создание/обновление администратора
- `/debug/set-admin-session` - Установка сессии администратора
- `/debug/check-session` - Проверка текущей сессии