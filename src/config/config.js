require("dotenv").config();

const API_KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyCf5gQrhTdDU035QO52jE4HOZJqPQRsICE";
const BASE_API_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

module.exports = {
  API_KEY,
  BASE_API_URL,
  OPENAI_API_KEY,
  TELEGRAM_BOT_TOKEN,
};
