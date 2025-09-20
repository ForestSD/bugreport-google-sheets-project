# LTO 2.0 Bug Report Bot

> **Интеллектуальный Telegram-бот для автоматизации создания багрепортов с поддержкой множественных AI провайдеров**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-blue.svg)](https://telegram.org/)
[![AI](https://img.shields.io/badge/AI-Multi_Provider-purple.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Описание

LTO 2.0 Bug Report Bot - это продвинутый Telegram-бот, специально разработанный для автоматизации процесса создания багрепортов. Бот использует современные AI технологии для преобразования простых описаний проблем в структурированные, детальные багрепорты.

## ✨ Ключевые возможности

### **Множественные AI провайдеры с автоматическим fallback**

- **OpenAI GPT-4** - Премиум качество (требует API ключ)
- **G4F Python Server** - Бесплатный доступ к GPT через множественные провайдеры
- **G4F Node.js** - Резервный бесплатный доступ
- **Ollama (Local Llama)** - Локальные модели (llama3:8b, llama3.2:1b)
- **Hugging Face** - Открытые модели
- **Replicate** - Облачные Llama модели
- **Mock Responses** - Надежный fallback

### **Интеграции**

- **Google Sheets API** - Автоматическое сохранение багрепортов
- **Worksection** - Создание задач в системе управления проектами
- **Telegram Bot API** - Богатый интерфейс с inline клавиатурами

### **Умная обработка**

- Контекстно-зависимые промпты для лазертаг приложения
- Автоматическое дополнение недостающих полей
- Поддержка различных форматов ответов (Markdown, Bold)
- Валидация и структурирование данных

## Быстрый старт

### 1. Подготовка окружения

```bash
git clone <repository-url>
cd google-sheets-project
npm install
```

### 2. Конфигурация

Создайте файл `.env`:

```env
# Обязательно
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Опционально (для улучшения качества)
OPENAI_API_KEY=your_openai_key
GOOGLE_SHEETS_API_KEY=your_google_sheets_key
HUGGINGFACE_TOKEN=your_hf_token
REPLICATE_API_TOKEN=your_replicate_token

# Worksection (опционально)
WORKSECTION_EMAIL=your_email
WORKSECTION_PASSWORD=your_password
```

### 3. Запуск G4F Python сервера (рекомендуется)

```bash
# Установка зависимостей
pip install -r g4f_requirements.txt

# Запуск сервера
python g4f_server.py
```

### 4. Запуск бота

```bash
npm start
```

## Использование

### Основные команды

- `/start` - Инициализация бота
- `/setcredentials` - Настройка Worksection
- `/addproject` - Добавление проекта
- `/projects` - Выбор активного проекта

### Создание багов

1. **Простое описание**: Отправьте текст с описанием проблемы
2. **Из Google Sheets**: Сканирование таблиц с результатами тестов
3. **Из чек-листа**: Обработка структурированных данных

### Пример использования

```
Пользователь: "бронежилет не защищает от урона"

Бот создаст структурированный багрепорт:
 Название: Неэффективная защита бронежилета от входящего урона
 Описание: Детальное описание проблемы в контексте лазертаг игры
 Шаги воспроизведения: Пошаговые инструкции
 Ожидаемый результат: Правильное поведение
 Фактический результат: Описание бага
 Окружение: LTO 2.0, Android 10+, лазертаг оборудование
```

## Архитектура

### Основные компоненты

```
 Telegram Bot
 ↓
 Bug Handlers (Бизнес-логика)
 ↓
 GPT Service (AI обработка)
 ↓
 Multi-Provider Chain:
 1. OpenAI GPT-4
 2. G4F Python Server
 3. G4F Node.js
 4. Ollama (Local)
 5. Hugging Face
 6. Replicate
 7. Mock Response
 ↓
 Storage & APIs:
 - JSON Storage
 - Google Sheets
 - Worksection
```

### G4F Python Server

Отдельный Flask сервер для стабильной работы с G4F:

```python
# Endpoints:
GET /health # Проверка статуса
POST /chat # Генерация ответов
GET /providers # Список провайдеров
```

### Поддерживаемые провайдеры G4F:

- Bing
- You
- ChatgptFree
- FreeGpt
- OpenaiChat
- ChatgptAi
- Aichat
- ChatForAi

## � Структура проекта

```
google-sheets-project/
├── bot.js # Точка входа
├── g4f_server.py # Python сервер для G4F
├── start_g4f_server.bat # Запуск G4F сервера
├── g4f_requirements.txt # Python зависимости
│
├── � src/
│ ├── � api/
│ │ └── sheets.js # Google Sheets интеграция
│ │
│ ├── � config/
│ │ ├── config.js # Конфигурация проекта
│ │ └── prompt.js # AI промпты с контекстом LTO 2.0
│ │
│ ├── � handlers/
│ │ ├── bugHandlers.js # Основная бизнес-логика
│ │ └── telegramHandlers.js # Telegram интерфейс
│ │
│ ├── � services/
│ │ ├── gptService.js # Мульти-провайдер AI сервис
│ │ ├── userStorage.js # Управление пользователями
│ │ ├── projectManager.js # Управление проектами
│ │ ├── validation.js # Валидация данных
│ │ └── worksectionService.js # Worksection API
│ │
│ ├── � keyboards/
│ │ └── inlineKeyboards.js # Telegram UI
│ │
│ └── � components/
│ ├── domUtils.js # DOM утилиты
│ └── loading.js # Индикаторы загрузки
│
├── � storage/
│ └── users.json # Локальные данные пользователей
│
└── � automation/
 ├── login-worksection.js # Автоматизация Worksection
 └── worksection-task.js # Создание задач
```

## Конфигурация AI провайдеров

### OpenAI

```javascript
// Высокое качество, платный
model: "gpt-4";
temperature: 0.7;
```

### Ollama (Local)

```javascript
// Локальные модели
models: ["llama3:8b", "llama3.2:1b"];
num_predict: 1000;
temperature: 0.4;
```

### G4F

```javascript
// Бесплатные провайдеры
providers: [Bing, You, ChatgptFree, FreeGpt]
timeout: 120s
```

## Отладка

### Логи

Бот выводит детальные логи:

```
 G4F Python сервер доступен
 Пробуем провайдер: You...
 Успешный ответ от g4f Python (You)
 Парсим ответ: **Название:** ...
```

### Типичные проблемы

1. **G4F недоступен**: Запустите `python g4f_server.py`
2. **IPv6 конфликт**: Используем `127.0.0.1` вместо `localhost`
3. **Ollama не найден**: Установите Ollama и загрузите модели
4. **Парсинг ошибок**: Поддерживаем `**bold**` и `#### markdown`

## Развертывание

### Локальное

```bash
npm install
python -m pip install -r g4f_requirements.txt
python g4f_server.py &
npm start
```

### Docker (планируется)

```bash
docker-compose up
```

### Системные требования

- Node.js 18+
- Python 3.10+ (для G4F)
- RAM: 4GB+ (для локального Ollama)
- Интернет для внешних API

## Статистика

- **Поддерживаемые AI провайдеры**: 7+
- **Fallback уровни**: 7
- **Форматы ответов**: 2 (Markdown, Bold)
- **Интеграции**: 3 (Telegram, Google Sheets, Worksection)

## � Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## Лицензия

MIT License - см. [LICENSE](LICENSE) файл

## � Авторы

- **ForestSD** - Initial work

---

> **Tip**: Для лучшего качества багрепортов рекомендуется настроить G4F Python сервер или OpenAI API ключ
