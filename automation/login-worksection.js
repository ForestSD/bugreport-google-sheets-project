const puppeteer = require("puppeteer");

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let browserInstance = null;
let page = null;

async function loginToWorksection(email, password, projectUrl, bugsJson) {
  try {
    console.log("Проверяем JSON с багами...");
    console.log("IDIJ:", bugsJson);

    let bugs = [];
    try {
      bugs = JSON.parse(bugsJson);
      if (!Array.isArray(bugs)) throw new Error("bugs должен быть массивом!");
    } catch (err) {
      console.error("Ошибка парсинга JSON:", err.message);
      process.exit(1);
    }

    console.log("MYBUGS:", bugs);

    if (!browserInstance) {
      page = await performLogin(email, password, projectUrl);
    } else {
      console.log("Puppeteer уже запущен. Используем существующий браузер.");
      await page.bringToFront();
    }

    if (bugs.length === 0) {
      console.log("Нет багов для создания.");
      return;
    }

    console.log(`Всего багов для обработки: ${bugs.length}`);

    // Первая вкладка уже открыта – используем её для первого бага
    console.log(`Создаём баг 1 из ${bugs.length}: ${bugs[0].title}`);
    await createBug(page, bugs[0]);

    // Обрабатываем остальные баги в новых вкладках
    for (let i = 1; i < bugs.length; i++) {
      console.log(`Создаём баг ${i + 1} из ${bugs.length}: ${bugs[i].title}`);

      const newPage = await browserInstance.newPage();
      await newPage.goto(projectUrl, { waitUntil: "networkidle2" });
      await wait(3000);
      await createBug(newPage, bugs[i]);
    }

    console.log("✅ Все баги обработаны!");
  } catch (error) {
    console.error("Ошибка в loginToWorksection:", error.message);
  }
}

async function performLogin(email, password, projectUrl) {
  try {
    console.log("Запускаем Puppeteer...");

    if (!browserInstance) {
      browserInstance = await puppeteer.launch({
        headless: false,
        args: ["--start-maximized"],
        defaultViewport: null,
      });

      const pages = await browserInstance.pages();
      page = pages[0];
    }

    await page.goto("https://netronic.worksection.com/login/", {
      waitUntil: "networkidle2",
    });

    await wait(2000);

    console.log("Вводим email...");
    await page.type("input[name='email']", email, { delay: 10 });

    console.log("Вводим пароль...");
    await page.type("input[name='password']", password, { delay: 10 });

    console.log("Нажимаем кнопку входа...");
    await page.click("input[type='button'][value='Увійти']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    console.log("Успешный вход!");

    if (projectUrl) {
      console.log(`Переход в проект: ${projectUrl}`);
      await page.goto(projectUrl, { waitUntil: "networkidle2" });
      await wait(2000);
    }

    console.log("Логин завершён.");
    return page;
  } catch (error) {
    console.error("Ошибка при логине:", error.message);
    return null;
  }
}

async function createBug(page, bug) {
  try {
    await wait(3000);
    await page.waitForSelector("#ta_name", { timeout: 10000 });

    await page.evaluate((title) => {
      const titleInput = document.querySelector("#ta_name");
      if (titleInput) {
        titleInput.value = "";
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        titleInput.value = title;
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, bug.title);

    await page.click("#editor .data");
    await page.waitForSelector("#editor .data", { timeout: 10000 });

    let cleanEnvironment = bug.environment || "";
    cleanEnvironment = cleanEnvironment.split("\n---")[0].trim();

    const fullDescription = [
      bug.description ? `Описание:\n${bug.description}` : "",
      bug.steps ? `Шаги для воспроизведения:\n${bug.steps}` : "",
      bug.expected ? `Ожидаемый результат:\n${bug.expected}` : "",
      bug.actual ? `Фактический результат:\n${bug.actual}` : "",
      cleanEnvironment ? `Тестовое окружение:\n${cleanEnvironment}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    await wait(3000);
    await page.evaluate((description) => {
      const editor = document.querySelector("#editor .data");
      if (editor) {
        editor.innerText = "";
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        editor.innerText = description;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, fullDescription);
    console.log("Описание вставлено!");
  } catch (error) {
    console.error("Ошибка при создании бага:", error.message);
  }
}

// Получаем данные из аргументов командной строки
const [email, password, projectUrl, bugsJson] = process.argv.slice(2);
loginToWorksection(email, password, projectUrl, bugsJson).catch((error) => {
  console.error("Ошибка:", error.message);
});

module.exports = { loginToWorksection };
