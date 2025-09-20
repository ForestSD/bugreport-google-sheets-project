# 🤖## ✨ Возможности

- 🤖 **Множественные AI провайдеры**:
  - OpenAI GPT-4 (платный, высокое качество)
  - g4f (бесплатный, иногда недоступен)
  - Ollama (локальные Llama модели)
  - Hugging Face (бесплатные модели)
  - Replicate (облачные Llama модели)
  - Mock responses (надёжный fallback)
- 📊 **Google Sheets**: Автоматическое сохранение багрепортов в Google таблицы
- 📋 **Worksection**: Создание задач в системе управления проектами
- 💾 **Локальное хранение**: JSON-файлы для хранения данных пользователей и проектов
- 🔄 **Автоматический fallback**: Если один провайдер недоступен, система пробует следующий
- 📱 **Telegram интерфейс**: Удобные inline-клавиатуры и командыm Bug Report Bot

Телеграм-бот для создания детализированных багрепортов с интеграцией Google Sheets, ChatGPT и Worksection.

## ✨ Возможности

- 🤖 **ChatGPT интеграция**: Автоматическое создание структурированных багрепортов из описаний пользователей
- � **Google Sheets**: Автоматическое сохранение багрепортов в Google таблицы
- � **Worksection**: Создание задач в системе управления проектами
- � **Локальное хранение**: JSON-файлы для хранения данных пользователей и проектов
- � **Множественные API**: OpenAI API, g4f (бесплатный), mock-ответы как fallback
- 📱 **Telegram интерфейс**: Удобные inline-клавиатуры и команды

## 🚀 Установка

### 1. Клонируйте проект

```bash
git clone <your-repo>
cd google-sheets-project
```

### 2. Установите зависимости

```bash
npm install
```

### 3. Настройте окружение

Создайте файл `.env` в корне проекта:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# OpenAI API (опционально, высокое качество)
OPENAI_API_KEY=your_openai_api_key_here

# Hugging Face (опционально, бесплатные модели)
HUGGINGFACE_TOKEN=your_huggingface_token_here

# Replicate (опционально, облачные Llama модели)
REPLICATE_API_TOKEN=your_replicate_token_here

# Google Sheets API
GOOGLE_SHEETS_API_KEY=your_google_api_key_here

# Worksection (опционально)
WORKSECTION_EMAIL=your_email@example.com
WORKSECTION_PASSWORD=your_password
```

### 4. Получите API ключи

#### Telegram Bot Token:

1. Найдите [@BotFather](https://t.me/botfather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Скопируйте токен в `.env`

#### Google Sheets API:

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API
4. Создайте API ключ в разделе "Credentials"
5. Скопируйте ключ в `.env`

#### OpenAI API (опционально):

1. Зайдите на [OpenAI Platform](https://platform.openai.com/)
2. Создайте API ключ
3. Добавьте его в `.env`

**Примечание**: Если у вас нет OpenAI API ключа, бот будет использовать бесплатные альтернативы (g4f) или mock-ответы.

## 📱 Использование

### Первый запуск

1. Запустите бота командой `/start`
2. Настройте учетные данные командой `/setcredentials`
3. Добавьте проект командой `/addproject`

### Основные команды

- `/start` - Начать работу с ботом
- `/setcredentials` - Настроить учетные данные Worksection
- `/addproject` - Добавить новый проект
- `/projects` - Выбрать проект

### Создание багов

**Одиночный баг:**

1. Выберите "🐛 Создать баг" в главном меню
2. Опишите проблему текстом
3. Получите сгенерированный баг-репорт
4. Скопируйте или отправьте в Worksection

**Из Google Sheets:**

1. Выберите "📊 Сканировать таблицу"
2. Введите ссылку на Google Sheets
3. Укажите столбец с результатами (например: C)
4. Выберите значения для обработки
5. Получите множественные баг-репорты

**Из чек-листа:**

1. Выберите "📋 Из чек-листа"
2. Вставьте данные, разделенные `---`
3. Получите обработанные баги

## 📁 Структура проекта

```
📁 google-sheets-project/
├── 📄 bot.js                          # Главный файл бота
├── 📄 .env                            # Переменные окружения
├── 📄 package.json                    # Зависимости
│
├── 📁 src/
│   ├── 📁 api/
│   │   └── 📄 sheets.js               # Google Sheets API
│   │
│   ├── 📁 config/
│   │   ├── 📄 config.js               # Конфигурация
│   │   └── 📄 prompt.js               # GPT промпт
│   │
│   ├── 📁 handlers/
│   │   ├── 📄 bugHandlers.js          # Бизнес-логика
│   │   └── 📄 telegramHandlers.js     # Telegram обработчики
│   │
│   ├── 📁 services/
│   │   ├── 📄 userStorage.js          # Хранение данных
│   │   ├── 📄 projectManager.js       # Управление проектами
│   │   ├── 📄 validation.js           # Валидация
│   │   ├── 📄 gptService.js           # GPT интеграция
│   │   └── 📄 worksectionService.js   # Worksection интеграция
│   │
│   └── 📁 keyboards/
│       └── 📄 inlineKeyboards.js      # Telegram клавиатуры
│
└── 📁 storage/
    └── 📄 users.json                  # Данные пользователей
```

## 🔄 Процесс работы

1. **Авторизация** - пользователь настраивает учетные данные
2. **Выбор проекта** - из сохраненных или добавление нового
3. **Создание контента** - описание бага или загрузка данных
4. **Обработка GPT** - автоматическая генерация структурированного баг-репорта
5. **Результат** - просмотр, копирование или отправка в Worksection

## 🛠️ Разработка

### Скрипты

```bash
npm start       # Запуск бота
npm run dev     # Запуск с nodemon для разработки
```

### Добавление новых функций

1. **Новые команды** - добавить в `telegramHandlers.js`
2. **Бизнес-логика** - расширить `bugHandlers.js`
3. **API интеграции** - создать новые сервисы в `services/`
4. **UI элементы** - добавить клавиатуры в `inlineKeyboards.js`

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте логи в консоли
2. Убедитесь в правильности `.env` настроек
3. Проверьте права доступа к Google Sheets API
4. Убедитесь в корректности учетных данных Worksection

## 📝 Лицензия

MIT License
