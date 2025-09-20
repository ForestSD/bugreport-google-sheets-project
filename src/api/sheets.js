const axios = require("axios");
const config = require("../config/config");

class Sheets {
  static async getSheetMetadata(sheetId) {
    const API_URL = `${config.BASE_API_URL}/${sheetId}?key=${config.API_KEY}`;

    try {
      const response = await axios.get(API_URL);
      const data = response.data;
      return data.sheets.map((sheet) => ({
        title: sheet.properties.title,
        sheetId: sheet.properties.sheetId,
      }));
    } catch (error) {
      throw new Error(
        `Ошибка получения метаданных: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }

  static async getSheetNameByGid(sheetId, gid) {
    const sheets = await this.getSheetMetadata(sheetId);
    const targetSheet = sheets.find((sheet) => sheet.sheetId === parseInt(gid));
    if (!targetSheet) throw new Error(`Лист с GID ${gid} не найден.`);
    return targetSheet.title;
  }

  // Запрос данных из таблицы с учетом имени листа
  static async fetchAllDataFromSheet(sheetId, sheetName, range = "A:Z") {
    const RANGE = `${sheetName}!${range}`; // Имя листа
    const API_URL = `${config.BASE_API_URL}/${sheetId}/values/${RANGE}?key=${config.API_KEY}`;

    try {
      const response = await axios.get(API_URL);
      const data = response.data;
      return data.values || [];
    } catch (error) {
      throw new Error(
        `Ошибка получения данных: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }
}

module.exports = Sheets;
