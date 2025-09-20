const puppeteer = require("puppeteer");

class WorksectionService {
 constructor() {
 this.browserInstance = null;
 this.activePage = null;
 }

 // Утилита ожидания
 wait(ms) {
 return new Promise((resolve) => setTimeout(resolve, ms));
 }

 // Авторизация в Worksection
 async performLogin(email, password, projectUrl) {
 try {
 console.log("Запускаем Puppeteer для авторизации...");

 if (!this.browserInstance) {
 this.browserInstance = await puppeteer.launch({
 headless: false,
 args: ["--start-maximized"],
 defaultViewport: null,
 });

 const pages = await this.browserInstance.pages();
 this.activePage = pages[0];
 }

 await this.activePage.goto("https://netronic.worksection.com/login/", {
 waitUntil: "networkidle2",
 });

 await this.wait(2000);

 console.log("Вводим email...");
 await this.activePage.type("input[name='email']", email, { delay: 10 });

 console.log("Вводим пароль...");
 await this.activePage.type("input[name='password']", password, {
 delay: 10,
 });

 console.log("Нажимаем кнопку входа...");
 await this.activePage.click("input[type='button'][value='Увійти']");
 await this.activePage.waitForNavigation({ waitUntil: "networkidle2" });

 console.log("Успешная авторизация!");

 if (projectUrl) {
 console.log(`Переход в проект: ${projectUrl}`);
 await this.activePage.goto(projectUrl, { waitUntil: "networkidle2" });
 await this.wait(2000);
 }

 return this.activePage;
 } catch (error) {
 console.error("Ошибка при авторизации:", error.message);
 throw error;
 }
 }

 // Получение списка доступных проектов
 async getAvailableProjects(email, password) {
 try {
 await this.performLogin(email, password);

 // Переходим на страницу со списком проектов
 await this.activePage.goto("https://netronic.worksection.com/", {
 waitUntil: "networkidle2",
 });

 await this.wait(3000);

 // Ищем проекты на странице
 const projects = await this.activePage.evaluate(() => {
 const projectElements = document.querySelectorAll("[data-project-id]");
 const projectList = [];

 projectElements.forEach((element) => {
 const id = element.getAttribute("data-project-id");
 const name = element.textContent?.trim();
 const url =
 element.href || `https://netronic.worksection.com/project/${id}/`;

 if (id && name) {
 projectList.push({ id, name, url });
 }
 });

 return projectList;
 });

 console.log("Найденные проекты:", projects);
 return projects;
 } catch (error) {
 console.error("Ошибка при получении проектов:", error.message);
 throw error;
 }
 }

 // Создание одного бага
 async createBug(page, bugData) {
 try {
 console.log(`Создаем баг: ${bugData.title}`);

 await this.wait(3000);
 await page.waitForSelector("#ta_name", { timeout: 10000 });

 // Заполняем название
 await page.evaluate((title) => {
 const titleInput = document.querySelector("#ta_name");
 if (titleInput) {
 titleInput.value = "";
 titleInput.dispatchEvent(new Event("input", { bubbles: true }));
 titleInput.value = title;
 titleInput.dispatchEvent(new Event("input", { bubbles: true }));
 }
 }, bugData.title);

 // Заполняем описание
 await page.click("#editor .data");
 await page.waitForSelector("#editor .data", { timeout: 10000 });

 let cleanEnvironment = bugData.environment || "";
 cleanEnvironment = cleanEnvironment.split("\n---")[0].trim();

 const fullDescription = [
 bugData.description ? `Описание:\n${bugData.description}` : "",
 bugData.steps ? `Шаги для воспроизведения:\n${bugData.steps}` : "",
 bugData.expected ? `Ожидаемый результат:\n${bugData.expected}` : "",
 bugData.actual ? `Фактический результат:\n${bugData.actual}` : "",
 cleanEnvironment ? `Тестовое окружение:\n${cleanEnvironment}` : "",
 ]
 .filter(Boolean)
 .join("\n\n");

 await this.wait(3000);
 await page.evaluate((description) => {
 const editor = document.querySelector("#editor .data");
 if (editor) {
 editor.innerText = "";
 editor.dispatchEvent(new Event("input", { bubbles: true }));
 editor.innerText = description;
 editor.dispatchEvent(new Event("input", { bubbles: true }));
 }
 }, fullDescription);

 console.log(` Баг "${bugData.title}" создан!`);
 return true;
 } catch (error) {
 console.error(
 `Ошибка при создании бага "${bugData.title}":`,
 error.message
 );
 throw error;
 }
 }

 // Создание множественных багов
 async createMultipleBugs(email, password, projectUrl, bugs) {
 try {
 if (!Array.isArray(bugs) || bugs.length === 0) {
 throw new Error("Список багов пуст или некорректен");
 }

 console.log(`Всего багов для создания: ${bugs.length}`);

 // Авторизуемся
 const page = await this.performLogin(email, password, projectUrl);

 // Создаем первый баг на текущей странице
 console.log(`Создаём баг 1 из ${bugs.length}: ${bugs[0].title}`);
 await this.createBug(page, bugs[0]);

 // Создаем остальные баги в новых вкладках
 for (let i = 1; i < bugs.length; i++) {
 console.log(`Создаём баг ${i + 1} из ${bugs.length}: ${bugs[i].title}`);

 const newPage = await this.browserInstance.newPage();
 await newPage.goto(projectUrl, { waitUntil: "networkidle2" });
 await this.wait(3000);
 await this.createBug(newPage, bugs[i]);
 }

 console.log(" Все баги успешно созданы!");
 return { success: true, created: bugs.length };
 } catch (error) {
 console.error("Ошибка при создании багов:", error.message);
 throw error;
 }
 }

 // Закрытие браузера
 async closeBrowser() {
 if (this.browserInstance) {
 await this.browserInstance.close();
 this.browserInstance = null;
 this.activePage = null;
 console.log("Браузер закрыт.");
 }
 }

 // Проверка активности браузера
 isActive() {
 return this.browserInstance !== null;
 }
}

module.exports = new WorksectionService();
