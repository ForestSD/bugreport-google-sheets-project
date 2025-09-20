// Telegram Bot - точка входа приложения

require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const telegramHandlers = require("./src/handlers/telegramHandlers");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log("Bug Report Bot запускается...");

bot.onText(/\/start/, (msg) => telegramHandlers.startCommand(bot, msg));
bot.onText(/\/setcredentials/, (msg) =>
  telegramHandlers.setCredentialsCommand(bot, msg)
);
bot.onText(/\/addproject/, (msg) =>
  telegramHandlers.addProjectCommand(bot, msg)
);
bot.onText(/\/projects/, (msg) => telegramHandlers.projectsCommand(bot, msg));

bot.on("message", (msg) => {
  if (!msg.text?.startsWith("/")) {
    console.log(
      `📨 Получено сообщение от пользователя ${msg.from.id}: "${msg.text}"`
    );
    telegramHandlers.handleMessage(bot, msg);
  }
});

// Обработка callback запросов (inline кнопки)
bot.on("callback_query", (callbackQuery) => {
  telegramHandlers.handleCallbackQuery(bot, callbackQuery);
});

// Обработка ошибок
bot.on("error", (error) => {
  console.error("Ошибка Telegram Bot:", error);
});

bot.on("polling_error", (error) => {
  console.error("Ошибка polling:", error);
});

console.log("Bug Report Telegram Bot запущен!");
