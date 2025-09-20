// Bug Handlers - основная логика обработки багрепортов

const Sheets = require("../api/sheets");
const Validation = require("../services/validation");
const userStorage = require("../services/userStorage");
const ProjectManager = require("../services/projectManager");
const gptService = require("../services/gptService");
const worksectionService = require("../services/worksectionService");
const { BASE_PROMPT } = require("../config/prompt");

class BugHandlers {
  constructor() {
    userStorage.initStorage();
  }

  async initializeUser(userId) {
    const credentials = await userStorage.getCredentials(userId);

    if (credentials && !userStorage.isExpired(credentials.savedAt)) {
      return { hasCredentials: true, expired: false };
    } else {
      if (credentials) {
        await userStorage.clearCredentials(userId);
      }
      return { hasCredentials: false, expired: credentials ? true : false };
    }
  }

  // Сохранить учетные данные
  async saveCredentials(userId, email, password) {
    if (!Validation.validateEmail(email)) {
      throw new Error("Некорректный email адрес");
    }

    if (!Validation.validatePassword(password)) {
      throw new Error("Пароль должен содержать минимум 6 символов");
    }

    await userStorage.saveCredentials(userId, email, password);
    return true;
  }

  // Получить проекты пользователя
  async getUserProjects(userId) {
    const projectManager = new ProjectManager(userId);
    const projects = await projectManager.getAllProjects();
    return projects;
  }

  // Добавить новый проект
  async addProject(userId, name, url) {
    if (!name || !url) {
      throw new Error("Название и URL проекта обязательны");
    }

    if (!Validation.validateUrl(url)) {
      throw new Error("Некорректный URL проекта");
    }

    const projectManager = new ProjectManager(userId);
    const projectId = await projectManager.addNewProject(name, url);
    return projectId;
  }

  // Удалить проект
  async deleteProject(userId, projectId) {
    const projectManager = new ProjectManager(userId);
    return await projectManager.deleteProject(projectId);
  }

  // Выбрать проект
  async selectProject(userId, projectId) {
    const projectManager = new ProjectManager(userId);
    return await projectManager.selectProject(projectId);
  }

  // Получить выбранный проект
  async getSelectedProject(userId) {
    const projectManager = new ProjectManager(userId);
    return await projectManager.getSelectedProject();
  }

  // Сканировать Google Sheets
  async scanGoogleSheets(sheetUrl, resultColumn) {
    if (!sheetUrl) {
      throw new Error("Введите ссылку на таблицу!");
    }

    const SPREADSHEET_ID = Validation.extractSpreadsheetId(sheetUrl);
    const GID = Validation.extractGid(sheetUrl);

    if (!SPREADSHEET_ID) {
      throw new Error("Некорректная ссылка на таблицу!");
    }

    if (!resultColumn) {
      throw new Error("Введите столбец с результатами (например, C)!");
    }

    if (!/^[A-Z]$/.test(resultColumn.toUpperCase())) {
      throw new Error("Введите корректный столбец: одна латинская буква!");
    }

    try {
      // Получаем имя листа по GID
      const sheetName = await Sheets.getSheetNameByGid(SPREADSHEET_ID, GID);

      // Получаем все данные
      const allRows = await Sheets.fetchAllDataFromSheet(
        SPREADSHEET_ID,
        sheetName
      );

      const columnIndex = resultColumn.toUpperCase().charCodeAt(0) - 65;

      const columnValues = allRows
        .slice(1) // Пропускаем заголовок
        .map((row) => row[columnIndex])
        .filter((v) => v);

      Validation.validateColumnValues(columnValues);

      const uniqueValues = [...new Set(columnValues)];

      return {
        allRows,
        uniqueValues,
        columnIndex,
      };
    } catch (error) {
      throw new Error(`Ошибка при сканировании таблицы: ${error.message}`);
    }
  }

  // Фильтровать строки по выбранным значениям
  filterRows(allRows, selectedValues, columnIndex) {
    if (!selectedValues || selectedValues.length === 0) {
      throw new Error("Выберите хотя бы одно значение!");
    }

    const filteredRows = allRows.filter(
      (row, rowIndex) =>
        rowIndex > 0 && // Пропускаем заголовок
        selectedValues.includes(row[columnIndex])
    );

    if (filteredRows.length === 0) {
      throw new Error("Нет строк, соответствующих выбранным критериям.");
    }

    return filteredRows.map((row) => row.join(" | "));
  }

  // Проверить что проект выбран
  async checkProjectSelected(userId) {
    const selectedProject = await this.getSelectedProject(userId);

    if (!selectedProject) {
      throw new Error("Пожалуйста, выберите проект перед продолжением!");
    }

    return selectedProject;
  }

  // Обработать один баг через GPT
  async processSingleBug(userId, bugDescription, basePrompt) {
    if (!bugDescription || !bugDescription.trim()) {
      throw new Error("Пожалуйста, введите описание бага.");
    }

    // Проверяем выбранный проект
    const selectedProject = await this.checkProjectSelected(userId);

    try {
      const formattedPrompt = `${
        basePrompt || BASE_PROMPT
      }\n\nОписание бага:\n${bugDescription.trim()}`;

      // Реальный вызов GPT сервиса
      const response = await gptService.sendToChatGPT(formattedPrompt);

      if (!response || !Array.isArray(response) || response.length === 0) {
        throw new Error("GPT вернул некорректный ответ");
      }

      const bugData = {
        title: response[0].title || "Без названия",
        description: response[0].description || "Без описания",
        steps: response[0].steps || "Нет шагов",
        expected: response[0].expected || "Ожидаемый результат не указан",
        actual: response[0].actual || "Фактический результат не указан",
        environment: response[0].environment || "Тестовое окружение не указано",
      };

      return {
        bug: bugData,
        project: selectedProject,
      };
    } catch (error) {
      throw new Error(`Ошибка при генерации бага через GPT: ${error.message}`);
    }
  }

  // Обработать множественные баги из чек-листа
  async processChecklistBugs(userId, checklistData, basePrompt) {
    if (!checklistData || !checklistData.trim()) {
      throw new Error("Нет данных для обработки багов!");
    }

    // Проверяем выбранный проект
    const selectedProject = await this.checkProjectSelected(userId);

    const bugItems = checklistData
      .split("---")
      .map((item) => item.trim())
      .filter(Boolean);

    console.log(`Всего багов для обработки: ${bugItems.length}`);

    const processedBugs = [];

    for (let i = 0; i < bugItems.length; i++) {
      const item = bugItems[i];
      try {
        const formattedPrompt = `${basePrompt || BASE_PROMPT}\n\nЭлемент #${
          i + 1
        }:\n${item}`;

        console.log(
          `Отправляем в GPT (${i + 1}/${bugItems.length}):`,
          formattedPrompt
        );

        // Реальный вызов GPT сервиса
        const response = await gptService.sendToChatGPT(formattedPrompt);

        if (!response || !Array.isArray(response) || response.length === 0) {
          throw new Error("GPT вернул некорректный ответ");
        }

        response.forEach((bugData, index) => {
          processedBugs.push({
            index: processedBugs.length + 1,
            title: bugData.title || "Без названия",
            description: bugData.description || "Без описания",
            steps: bugData.steps || "Нет шагов",
            expected: bugData.expected || "Ожидаемый результат не указан",
            actual: bugData.actual || "Фактический результат не указан",
            environment: bugData.environment || "Тестовое окружение не указано",
          });
        });
      } catch (error) {
        console.error(`Ошибка обработки бага #${i + 1}:`, error.message);
      }
    }

    return {
      bugs: processedBugs,
      project: selectedProject,
    };
  }

  // Форматировать баг для отображения
  formatBugReport(bug) {
    return (
      ` **${bug.title}**\n\n` +
      ` **Описание:**\n${bug.description}\n\n` +
      ` **Шаги для воспроизведения:**\n${bug.steps}\n\n` +
      ` **Ожидаемый результат:**\n${bug.expected}\n\n` +
      ` **Фактический результат:**\n${bug.actual}\n\n` +
      ` **Тестовое окружение:**\n${bug.environment}`
    );
  }

  // Получить доступные проекты из Worksection
  async getWorksectionProjects(userId) {
    try {
      const credentials = await userStorage.getCredentials(userId);
      if (!credentials) {
        throw new Error("Учетные данные не найдены");
      }

      console.log("Получаем проекты из Worksection...");
      const projects = await worksectionService.getAvailableProjects(
        credentials.email,
        credentials.password
      );

      return projects;
    } catch (error) {
      console.error("Ошибка получения проектов из Worksection:", error);
      throw new Error(`Не удалось получить проекты: ${error.message}`);
    }
  }

  // Отправить один баг в Worksection
  async sendBugToWorksection(userId, bug) {
    try {
      const credentials = await userStorage.getCredentials(userId);
      if (!credentials) {
        throw new Error("Учетные данные не найдены");
      }

      const selectedProject = await this.getSelectedProject(userId);
      if (!selectedProject) {
        throw new Error("Проект не выбран");
      }

      console.log("Отправляем баг в Worksection...");
      await worksectionService.createMultipleBugs(
        credentials.email,
        credentials.password,
        selectedProject.url,
        [bug]
      );

      return { success: true, project: selectedProject };
    } catch (error) {
      console.error("Ошибка отправки бага в Worksection:", error);
      throw new Error(`Не удалось отправить баг: ${error.message}`);
    }
  }

  // Отправить множественные баги в Worksection
  async sendBugsToWorksection(userId, bugs) {
    try {
      const credentials = await userStorage.getCredentials(userId);
      if (!credentials) {
        throw new Error("Учетные данные не найдены");
      }

      const selectedProject = await this.getSelectedProject(userId);
      if (!selectedProject) {
        throw new Error("Проект не выбран");
      }

      console.log(`Отправляем ${bugs.length} багов в Worksection...`);
      const result = await worksectionService.createMultipleBugs(
        credentials.email,
        credentials.password,
        selectedProject.url,
        bugs
      );

      return {
        success: true,
        created: result.created,
        project: selectedProject,
      };
    } catch (error) {
      console.error("Ошибка отправки багов в Worksection:", error);
      throw new Error(`Не удалось отправить баги: ${error.message}`);
    }
  }
}

module.exports = new BugHandlers();
