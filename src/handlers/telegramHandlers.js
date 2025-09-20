const bugHandlers = require("./bugHandlers");
const InlineKeyboards = require("../keyboards/inlineKeyboards");
const ProjectManager = require("../services/projectManager");
const userStorage = require("../services/userStorage");

class TelegramHandlers {
  constructor() {
    // Храним состояния пользователей
    this.userStates = new Map();
  }

  // Получить состояние пользователя
  getUserState(userId) {
    return this.userStates.get(userId) || { step: "idle" };
  }

  // Установить состояние пользователя
  setUserState(userId, state) {
    this.userStates.set(userId, state);
  }

  // Команда /start
  async startCommand(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    try {
      // Инициализируем пользователя
      const userInfo = await bugHandlers.initializeUser(userId);

      if (!userInfo.hasCredentials) {
        await bot.sendMessage(
          chatId,
          "🤖 Добро пожаловать в Bug Report Bot!\n\n" +
            "Для начала работы необходимо указать ваши учетные данные для Worksection.\n\n" +
            "Используйте команду /setcredentials для настройки."
        );
        return;
      }

      // Проверяем есть ли проекты
      const projects = await bugHandlers.getUserProjects(userId);

      if (Object.keys(projects).length === 0) {
        await bot.sendMessage(
          chatId,
          "✅ Учетные данные найдены!\n\n" +
            "Теперь нужно добавить проекты для работы.\n\n" +
            "Используйте команду /addproject чтобы добавить проект."
        );
        return;
      }

      // Показываем проекты для выбора
      await this.showProjectsMenu(bot, chatId, userId);
    } catch (error) {
      console.error("Ошибка в startCommand:", error);
      await bot.sendMessage(chatId, "❌ Произошла ошибка при инициализации.");
    }
  }

  // Команда /setcredentials
  async setCredentialsCommand(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    this.setUserState(userId, { step: "waiting_email" });

    await bot.sendMessage(
      chatId,
      "🔑 Настройка учетных данных\n\n" + "Введите ваш email для Worksection:"
    );
  }

  // Команда /addproject
  async addProjectCommand(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    this.setUserState(userId, { step: "waiting_project_name" });

    await bot.sendMessage(
      chatId,
      "➕ Добавление нового проекта\n\n" + "Введите название проекта:"
    );
  }

  // Команда /projects
  async projectsCommand(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;

    await this.showProjectsMenu(bot, chatId, userId);
  }

  // Показать меню проектов
  async showProjectsMenu(bot, chatId, userId) {
    try {
      const projects = await bugHandlers.getUserProjects(userId);

      if (Object.keys(projects).length === 0) {
        await bot.sendMessage(
          chatId,
          "📂 У вас пока нет проектов.\n\n" +
            "Используйте команду /addproject чтобы добавить проект.",
          InlineKeyboards.getBackMenu("start")
        );
        return;
      }

      await bot.sendMessage(
        chatId,
        "📂 Выберите проект для работы:",
        InlineKeyboards.getProjectsMenu(projects)
      );
    } catch (error) {
      console.error("Ошибка при показе проектов:", error);
      await bot.sendMessage(chatId, "❌ Ошибка при загрузке проектов.");
    }
  }

  // Показать главное меню
  async showMainMenu(bot, chatId, userId) {
    try {
      const selectedProject = await bugHandlers.getSelectedProject(userId);

      if (!selectedProject) {
        await this.showProjectsMenu(bot, chatId, userId);
        return;
      }

      await bot.sendMessage(
        chatId,
        `🚀 Проект: *${selectedProject.name}*\n\n` + "Выберите действие:",
        {
          parse_mode: "Markdown",
          ...InlineKeyboards.getMainMenu(),
        }
      );
    } catch (error) {
      console.error("Ошибка в showMainMenu:", error);
      await bot.sendMessage(chatId, "❌ Ошибка при показе меню.");
    }
  }

  // Обработка текстовых сообщений
  async handleMessage(bot, msg) {
    const userId = msg.from.id;
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = this.getUserState(userId);

    console.log(
      `🔍 Обрабатываем сообщение от пользователя ${userId}, состояние: ${state.step}, текст: "${text}"`
    );

    try {
      switch (state.step) {
        case "waiting_email":
          this.setUserState(userId, { step: "waiting_password", email: text });
          await bot.sendMessage(chatId, "🔒 Теперь введите пароль:");
          break;

        case "waiting_password":
          try {
            await bugHandlers.saveCredentials(userId, state.email, text);
            this.setUserState(userId, { step: "idle" });
            await bot.sendMessage(chatId, "✅ Учетные данные сохранены!");
            await this.showProjectsMenu(bot, chatId, userId);
          } catch (error) {
            await bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
            this.setUserState(userId, { step: "waiting_email" });
            await bot.sendMessage(chatId, "Попробуйте еще раз. Введите email:");
          }
          break;

        case "waiting_project_name":
          this.setUserState(userId, {
            step: "waiting_project_url",
            projectName: text,
          });
          await bot.sendMessage(
            chatId,
            `📝 Название: ${text}\n\n` +
              "Теперь введите URL проекта Worksection:"
          );
          break;

        case "waiting_project_url":
          try {
            const projectId = await bugHandlers.addProject(
              userId,
              state.projectName,
              text
            );
            this.setUserState(userId, { step: "idle" });
            await bot.sendMessage(
              chatId,
              `✅ Проект "${state.projectName}" добавлен!`
            );
            await this.showProjectsMenu(bot, chatId, userId);
          } catch (error) {
            await bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
            this.setUserState(userId, { step: "waiting_project_name" });
            await bot.sendMessage(
              chatId,
              "Попробуйте еще раз. Введите название проекта:"
            );
          }
          break;

        case "waiting_bug_description":
          await this.processSingleBug(bot, chatId, userId, text);
          break;

        case "waiting_sheets_url":
          this.setUserState(userId, {
            step: "waiting_result_column",
            sheetUrl: text,
          });
          await bot.sendMessage(
            chatId,
            "📊 Теперь введите букву столбца с результатами (например: C):"
          );
          break;

        case "waiting_result_column":
          await this.processSheetsScan(
            bot,
            chatId,
            userId,
            state.sheetUrl,
            text
          );
          break;

        case "waiting_checklist_data":
          await this.processChecklistBugs(bot, chatId, userId, text);
          break;

        default:
          // Если нет активного состояния, проверяем есть ли проект и создаем баг
          console.log(`🔄 Default обработка для пользователя ${userId}`);
          const userInfo = await bugHandlers.initializeUser(userId);
          console.log(
            `👤 Пользователь ${userId}: hasCredentials=${userInfo.hasCredentials}, selectedProject=${userInfo.selectedProject}`
          );

          if (userInfo.hasCredentials && userInfo.selectedProject) {
            // Пользователь настроен и выбрал проект - создаем багрепорт
            console.log(
              `🐛 Пользователь ${userId} отправил описание бага: "${text}"`
            );
            await this.processSingleBug(bot, chatId, userId, text);
          } else {
            // Пользователь не настроен - показываем справку
            console.log(
              `❗ Пользователь ${userId} не настроен, показываем справку`
            );
            await bot.sendMessage(
              chatId,
              "ℹ️ Сначала настройте бота:\n" +
                "/start - Начать работу\n" +
                "/projects - Выбрать проект\n" +
                "/addproject - Добавить проект\n" +
                "/setcredentials - Настроить учетные данные"
            );
          }
      }
    } catch (error) {
      console.error("Ошибка в handleMessage:", error);
      await bot.sendMessage(
        chatId,
        "❌ Произошла ошибка при обработке сообщения."
      );
      this.setUserState(userId, { step: "idle" });
    }
  }

  // Обработка создания одного бага
  async processSingleBug(bot, chatId, userId, description) {
    try {
      await bot.sendMessage(chatId, "🤖 Генерирую баг-репорт...");

      const result = await bugHandlers.processSingleBug(userId, description);
      const formattedBug = bugHandlers.formatBugReport(result.bug);

      this.setUserState(userId, {
        step: "idle",
        lastBug: result.bug,
      });

      await bot.sendMessage(chatId, formattedBug, {
        parse_mode: "Markdown",
        ...InlineKeyboards.getBugResultMenu(),
      });
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
      this.setUserState(userId, { step: "idle" });
    }
  }

  // Обработка сканирования Google Sheets
  async processSheetsScan(bot, chatId, userId, sheetUrl, resultColumn) {
    try {
      await bot.sendMessage(chatId, "📊 Сканирую таблицу...");

      const scanResult = await bugHandlers.scanGoogleSheets(
        sheetUrl,
        resultColumn
      );

      this.setUserState(userId, {
        step: "selecting_values",
        scanData: scanResult,
      });

      await bot.sendMessage(
        chatId,
        `📋 Найдено ${scanResult.uniqueValues.length} уникальных значений.\n\n` +
          "Выберите значения для обработки:",
        InlineKeyboards.getScanResultMenu(scanResult.uniqueValues)
      );
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
      this.setUserState(userId, { step: "idle" });
    }
  }

  // Обработка чек-листа
  async processChecklistBugs(bot, chatId, userId, checklistData) {
    try {
      await bot.sendMessage(chatId, "🤖 Обрабатываю чек-лист...");

      const result = await bugHandlers.processChecklistBugs(
        userId,
        checklistData
      );

      this.setUserState(userId, {
        step: "idle",
        lastBugs: result.bugs,
      });

      await bot.sendMessage(
        chatId,
        `✅ Сгенерировано ${result.bugs.length} баг-репортов!\n\n` +
          `Проект: ${result.project.name}`,
        InlineKeyboards.getMultipleBugsMenu(result.bugs.length)
      );
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
      this.setUserState(userId, { step: "idle" });
    }
  }

  // Обработчик callback запросов (inline кнопки)
  async handleCallbackQuery(bot, callbackQuery) {
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    try {
      await bot.answerCallbackQuery(callbackQuery.id);

      if (data.startsWith("select_project_")) {
        const projectId = data.replace("select_project_", "");
        await bugHandlers.selectProject(userId, projectId);
        await this.showMainMenu(bot, chatId, userId);
      } else if (data === "create_single_bug") {
        this.setUserState(userId, { step: "waiting_bug_description" });
        await bot.sendMessage(chatId, "🐛 Опишите баг:");
      } else if (data === "create_from_checklist") {
        this.setUserState(userId, { step: "waiting_checklist_data" });
        await bot.sendMessage(
          chatId,
          "📋 Вставьте данные чек-листа.\n\n" +
            "Используйте '---' для разделения элементов:"
        );
      } else if (data === "scan_sheets") {
        this.setUserState(userId, { step: "waiting_sheets_url" });
        await bot.sendMessage(chatId, "📊 Введите ссылку на Google Sheets:");
      } else if (data === "settings") {
        await bot.sendMessage(
          chatId,
          "⚙️ Настройки",
          InlineKeyboards.getSettingsMenu()
        );
      } else if (data === "change_project" || data === "back_to_projects") {
        await this.showProjectsMenu(bot, chatId, userId);
      } else if (data === "back_to_main") {
        await this.showMainMenu(bot, chatId, userId);
      } else if (data === "add_project") {
        await this.addProjectCommand(bot, {
          from: { id: userId },
          chat: { id: chatId },
        });
      } else if (data === "change_credentials") {
        await this.setCredentialsCommand(bot, {
          from: { id: userId },
          chat: { id: chatId },
        });
      } else if (data === "send_to_worksection") {
        await this.handleSendToWorksection(bot, chatId, userId, "single");
      } else if (data === "send_all_to_worksection") {
        await this.handleSendToWorksection(bot, chatId, userId, "multiple");
      } else if (data === "copy_bug") {
        await this.handleCopyBug(bot, chatId, userId);
      } else if (data === "create_another_bug") {
        this.setUserState(userId, { step: "waiting_bug_description" });
        await bot.sendMessage(chatId, "🐛 Опишите новый баг:");
      }

      // Добавить обработку других callback'ов...
    } catch (error) {
      console.error("Ошибка в handleCallbackQuery:", error);
      await bot.sendMessage(chatId, "❌ Произошла ошибка.");
    }
  }

  // Обработка отправки в Worksection
  async handleSendToWorksection(bot, chatId, userId, type) {
    try {
      const state = this.getUserState(userId);

      if (type === "single" && state.lastBug) {
        await bot.sendMessage(chatId, "🚀 Отправляю баг в Worksection...");

        const result = await bugHandlers.sendBugToWorksection(
          userId,
          state.lastBug
        );

        await bot.sendMessage(
          chatId,
          `✅ Баг успешно отправлен в проект "${result.project.name}"!`
        );
      } else if (type === "multiple" && state.lastBugs) {
        await bot.sendMessage(
          chatId,
          `🚀 Отправляю ${state.lastBugs.length} багов в Worksection...`
        );

        const result = await bugHandlers.sendBugsToWorksection(
          userId,
          state.lastBugs
        );

        await bot.sendMessage(
          chatId,
          `✅ Успешно отправлено ${result.created} багов в проект "${result.project.name}"!`
        );
      } else {
        await bot.sendMessage(chatId, "❌ Нет данных для отправки.");
      }
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Ошибка отправки: ${error.message}`);
    }
  }

  // Обработка копирования бага
  async handleCopyBug(bot, chatId, userId) {
    try {
      const state = this.getUserState(userId);

      if (state.lastBug) {
        const formattedBug = bugHandlers.formatBugReport(state.lastBug);

        await bot.sendMessage(
          chatId,
          "📋 Баг скопирован в сообщение:\n\n" + formattedBug,
          { parse_mode: "Markdown" }
        );
      } else {
        await bot.sendMessage(chatId, "❌ Нет бага для копирования.");
      }
    } catch (error) {
      await bot.sendMessage(chatId, `❌ Ошибка копирования: ${error.message}`);
    }
  }
}

module.exports = new TelegramHandlers();
