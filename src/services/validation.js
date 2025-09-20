class Validation {
  static extractSpreadsheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }

  static extractGid(url) {
    const match = url.match(/gid=([0-9]+)/);
    return match ? match[1] : null;
  }

  static validateColumnValues(values) {
    if (values.length === 0) {
      throw new Error(
        "Выбранный столбец пуст. Убедитесь, что вы указали правильный столбец."
      );
    }

    if (values.some((value) => value.length > 20)) {
      throw new Error(
        "Некоторые значения в столбце содержат более 20 символов. Скорее всего, вы выбрали неправильный столбец."
      );
    }
  }

  // Дополнительные валидации для Telegram
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }

  static validateUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Фильтрация строк по значениям колонки
  static filterRowsByColumn(rows, values) {
    return rows.filter((row) => row.some((cell) => values.includes(cell)));
  }
}

module.exports = Validation;
