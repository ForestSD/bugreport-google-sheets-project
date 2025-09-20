const userStorage = require("./userStorage");

class ProjectManager {
  constructor(userId) {
    this.userId = userId;
  }

  // Загрузить проекты пользователя
  async loadProjects() {
    try {
      const projects = await userStorage.getProjects(this.userId);
      console.log(
        `Загружены проекты для пользователя ${this.userId}:`,
        projects
      );
      return projects;
    } catch (error) {
      console.error("Ошибка при загрузке проектов:", error);
      return {};
    }
  }

  // Сохранить проекты пользователя
  async saveProjects(projects) {
    try {
      await userStorage.saveProjects(this.userId, projects);
      console.log(
        `Проекты сохранены для пользователя ${this.userId}:`,
        projects
      );
    } catch (error) {
      console.error("Ошибка при сохранении проектов:", error);
    }
  }

  // Добавить новый проект
  async addNewProject(name, url) {
    const projects = await this.loadProjects();
    const id = `project_${Date.now()}`;

    projects[id] = { name, url };
    await this.saveProjects(projects);

    console.log(
      `Добавлен новый проект для пользователя ${this.userId}:`,
      name,
      url
    );
    return id;
  }

  // Удалить проект
  async deleteProject(projectId) {
    const projects = await this.loadProjects();

    if (projects[projectId]) {
      delete projects[projectId];
      await this.saveProjects(projects);
      console.log(
        `Проект с ID ${projectId} удален для пользователя ${this.userId}`
      );
      return true;
    } else {
      console.warn(
        `Проект с ID ${projectId} не найден для пользователя ${this.userId}`
      );
      return false;
    }
  }

  // Выбрать проект
  async selectProject(projectId) {
    const projects = await this.loadProjects();

    if (projects[projectId]) {
      await userStorage.setSelectedProject(this.userId, projectId);
      console.log(
        `Проект с ID ${projectId} выбран для пользователя ${this.userId}`
      );
      return true;
    } else {
      console.warn(
        `Проект с ID ${projectId} не найден для пользователя ${this.userId}`
      );
      return false;
    }
  }

  // Получить выбранный проект
  async getSelectedProject() {
    const projectId = await userStorage.getSelectedProject(this.userId);

    if (!projectId) {
      console.warn(`Не выбран проект для пользователя ${this.userId}`);
      return null;
    }

    const projects = await this.loadProjects();
    const selectedProject = projects[projectId];

    if (!selectedProject) {
      console.warn(
        `Проект с ID ${projectId} не найден для пользователя ${this.userId}`
      );
      await userStorage.clearSelectedProject(this.userId); // Очищаем некорректную ссылку
      return null;
    }

    console.log(
      `Получен выбранный проект для пользователя ${this.userId}:`,
      selectedProject
    );
    return { id: projectId, ...selectedProject };
  }

  // Очистить выбранный проект
  async clearSelectedProject() {
    await userStorage.clearSelectedProject(this.userId);
    console.log(`Выбранный проект очищен для пользователя ${this.userId}`);
  }

  // Проверить есть ли проекты
  async hasProjects() {
    const projects = await this.loadProjects();
    return Object.keys(projects).length > 0;
  }

  // Получить все проекты
  async getAllProjects() {
    return await this.loadProjects();
  }
}

module.exports = ProjectManager;
