const { InlineKeyboard } = require("node-telegram-bot-api");

class InlineKeyboards {
  // Главное меню после выбора проекта
  static getMainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🐛 Создать баг", callback_data: "create_single_bug" },
            { text: "📋 Из чек-листа", callback_data: "create_from_checklist" },
          ],
          [{ text: "📊 Сканировать таблицу", callback_data: "scan_sheets" }],
          [
            { text: "⚙️ Настройки", callback_data: "settings" },
            { text: "🔄 Сменить проект", callback_data: "change_project" },
          ],
        ],
      },
    };
  }

  // Меню выбора проекта
  static getProjectsMenu(projects) {
    const keyboard = [];

    // Добавляем кнопки проектов
    Object.entries(projects).forEach(([id, project]) => {
      keyboard.push([
        { text: `📁 ${project.name}`, callback_data: `select_project_${id}` },
      ]);
    });

    // Добавляем кнопки управления
    keyboard.push([
      { text: "➕ Добавить проект", callback_data: "add_project" },
      { text: "🗑️ Удалить проект", callback_data: "delete_project_mode" },
    ]);

    return {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };
  }

  // Меню удаления проектов
  static getDeleteProjectsMenu(projects) {
    const keyboard = [];

    Object.entries(projects).forEach(([id, project]) => {
      keyboard.push([
        { text: `🗑️ ${project.name}`, callback_data: `delete_project_${id}` },
      ]);
    });

    keyboard.push([{ text: "◀️ Назад", callback_data: "back_to_projects" }]);

    return {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };
  }

  // Меню для результата сканирования таблицы
  static getScanResultMenu(uniqueValues) {
    const keyboard = [];

    // Группируем значения по 2 в ряд
    for (let i = 0; i < uniqueValues.length; i += 2) {
      const row = [];
      row.push({ text: uniqueValues[i], callback_data: `select_value_${i}` });

      if (i + 1 < uniqueValues.length) {
        row.push({
          text: uniqueValues[i + 1],
          callback_data: `select_value_${i + 1}`,
        });
      }

      keyboard.push(row);
    }

    keyboard.push([
      { text: "✅ Выбрать все", callback_data: "select_all_values" },
      { text: "❌ Очистить", callback_data: "clear_selection" },
    ]);

    keyboard.push([
      { text: "🚀 Начать обработку", callback_data: "start_processing" },
      { text: "◀️ Назад", callback_data: "back_to_main" },
    ]);

    return {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    };
  }

  // Меню для результата генерации бага
  static getBugResultMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📋 Скопировать", callback_data: "copy_bug" },
            {
              text: "🚀 Отправить в Worksection",
              callback_data: "send_to_worksection",
            },
          ],
          [
            { text: "🔄 Создать еще", callback_data: "create_another_bug" },
            { text: "◀️ Главное меню", callback_data: "back_to_main" },
          ],
        ],
      },
    };
  }

  // Меню для множественных багов из чек-листа
  static getMultipleBugsMenu(bugsCount) {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: `🚀 Отправить все (${bugsCount}) в Worksection`,
              callback_data: "send_all_to_worksection",
            },
          ],
          [
            { text: "📋 Показать все баги", callback_data: "show_all_bugs" },
            { text: "📄 Экспорт в текст", callback_data: "export_bugs" },
          ],
          [{ text: "◀️ Главное меню", callback_data: "back_to_main" }],
        ],
      },
    };
  }

  // Меню настроек
  static getSettingsMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔑 Изменить учетные данные",
              callback_data: "change_credentials",
            },
          ],
          [{ text: "🔄 Сменить проект", callback_data: "change_project" }],
          [
            { text: "ℹ️ О боте", callback_data: "about_bot" },
            { text: "❓ Помощь", callback_data: "help" },
          ],
          [{ text: "◀️ Главное меню", callback_data: "back_to_main" }],
        ],
      },
    };
  }

  // Меню подтверждения
  static getConfirmMenu(action, data = "") {
    return {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Да", callback_data: `confirm_${action}_${data}` },
            { text: "❌ Нет", callback_data: `cancel_${action}` },
          ],
        ],
      },
    };
  }

  // Простое меню "Назад"
  static getBackMenu(target = "main") {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: "◀️ Назад", callback_data: `back_to_${target}` }],
        ],
      },
    };
  }
}

module.exports = InlineKeyboards;
