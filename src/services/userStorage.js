const fs = require("fs").promises;
const path = require("path");

class UserStorage {
  constructor() {
    this.storageDir = path.join(__dirname, "../../storage");
    this.usersFile = path.join(this.storageDir, "users.json");
    this.EXPIRATION_DAYS = 30;
  }

  // Инициализация хранилища
  async initStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });

      // Создаем файл если не существует
      try {
        await fs.access(this.usersFile);
      } catch (error) {
        await fs.writeFile(this.usersFile, "{}");
      }
    } catch (error) {
      console.error("Ошибка инициализации хранилища:", error);
    }
  }

  // Получить всех пользователей
  async getAllUsers() {
    try {
      const data = await fs.readFile(this.usersFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Ошибка чтения пользователей:", error);
      return {};
    }
  }

  // Сохранить пользователей
  async saveAllUsers(users) {
    try {
      await fs.writeFile(this.usersFile, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error("Ошибка сохранения пользователей:", error);
    }
  }

  // Получить данные пользователя
  async getUser(userId) {
    const users = await this.getAllUsers();
    return users[userId] || null;
  }

  // Сохранить учетные данные пользователя
  async saveCredentials(userId, email, password) {
    const users = await this.getAllUsers();
    const savedAt = new Date().toISOString();

    if (!users[userId]) {
      users[userId] = {};
    }

    users[userId].credentials = { email, password, savedAt };
    await this.saveAllUsers(users);

    console.log(`Учетные данные для пользователя ${userId} сохранены`);
  }

  // Получить учетные данные пользователя
  async getCredentials(userId) {
    const user = await this.getUser(userId);
    return user?.credentials || null;
  }

  // Удалить учетные данные пользователя
  async clearCredentials(userId) {
    const users = await this.getAllUsers();
    if (users[userId]?.credentials) {
      delete users[userId].credentials;
      await this.saveAllUsers(users);
      console.log(`Учетные данные для пользователя ${userId} удалены`);
    }
  }

  // Проверить истек ли срок действия данных
  isExpired(savedAt) {
    const savedDate = new Date(savedAt);
    const now = new Date();
    const diffInDays = (now - savedDate) / (1000 * 60 * 60 * 24);
    return diffInDays > this.EXPIRATION_DAYS;
  }

  // Сохранить проекты пользователя
  async saveProjects(userId, projects) {
    const users = await this.getAllUsers();
    if (!users[userId]) {
      users[userId] = {};
    }
    users[userId].projects = projects;
    await this.saveAllUsers(users);
  }

  // Получить проекты пользователя
  async getProjects(userId) {
    const user = await this.getUser(userId);
    return user?.projects || {};
  }

  // Установить выбранный проект
  async setSelectedProject(userId, projectId) {
    const users = await this.getAllUsers();
    if (!users[userId]) {
      users[userId] = {};
    }
    users[userId].selectedProject = projectId;
    await this.saveAllUsers(users);
  }

  // Получить выбранный проект
  async getSelectedProject(userId) {
    const user = await this.getUser(userId);
    return user?.selectedProject || null;
  }

  // Очистить выбранный проект
  async clearSelectedProject(userId) {
    const users = await this.getAllUsers();
    if (users[userId]?.selectedProject) {
      delete users[userId].selectedProject;
      await this.saveAllUsers(users);
    }
  }
}

module.exports = new UserStorage();
