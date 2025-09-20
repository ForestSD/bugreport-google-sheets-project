// GPT Service - обработка текста через различные провайдеры

const axios = require("axios");
const config = require("../config/config");
const { BASE_PROMPT, LLAMA_PROMPT } = require("../config/prompt");

let g4fClient;
try {
  const g4fModule = require("g4f");
  if (g4fModule.Client) {
    g4fClient = new g4fModule.Client();
  } else if (g4fModule.G4F) {
    g4fClient = new g4fModule.G4F();
  }
} catch (error) {
  console.log("g4f не установлен, используем альтернативные провайдеры");
}

let ollama;
try {
  const ollamaModule = require("ollama");
  ollama = ollamaModule.default;
} catch (error) {
  console.log("❌ Ollama не установлен");
}

// Пробуем подключить Hugging Face
let HfInference;
try {
  const { HfInference: HfInf } = require("@huggingface/inference");
  HfInference = HfInf;
  console.log("✅ Hugging Face загружен успешно");
} catch (error) {
  console.log("❌ Hugging Face не установлен");
}

// Пробуем подключить Replicate для Llama
let Replicate;
try {
  Replicate = require("replicate");
  console.log("✅ Replicate загружен успешно");
} catch (error) {
  console.log("❌ Replicate не установлен");
}

class GPTService {
  constructor() {
    this.providers = [
      "https://api.openai.com/v1/chat/completions", // основной
      // можно добавить альтернативные провайдеры
    ];
  }

  // Парсинг ответа от GPT (улучшен для разных форматов)
  extractBugData(response) {
    console.log("🔍 Парсим ответ:", response.substring(0, 300) + "...");

    // Улучшенные регулярные выражения для разных форматов ответов
    const titleMatch =
      response.match(/\*\*Название:\*\*\s*(.+?)(?=\n|$)/i) ||
      response.match(/####\s*Название:\s*(.+?)(?=\n|$)/i) ||
      response.match(/Название:\s*(.+?)(?=\n|$)/i) ||
      response.match(/\*\*(.+?)\*\*\s*(?=\n)/i); // Заголовок в **

    const descriptionMatch =
      response.match(
        /\*\*Описание:\*\*\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i
      ) ||
      response.match(
        /####\s*Описание:\s*([\s\S]+?)(?=\n####|\n\*\*|\n\n|$)/i
      ) ||
      response.match(/Описание:\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i);

    // Улучшенная обработка шагов воспроизведения
    let stepsMatch =
      response.match(
        /\*\*Шаги[^:]*:\*\*\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i
      ) ||
      response.match(
        /####\s*Шаги[^:]*:\s*([\s\S]+?)(?=\n####|\n\*\*|\n\n|$)/i
      ) ||
      response.match(/Шаги[^:]*:\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i);

    // Если не найдены как блок, ищем нумерованные шаги
    if (!stepsMatch) {
      const numberedSteps = response.match(/\d+\.\s*[^\n]+/g);
      if (numberedSteps && numberedSteps.length > 0) {
        stepsMatch = [null, numberedSteps.join("\n")];
      }
    }

    const expectedMatch =
      response.match(
        /\*\*Ожидаемый результат:\*\*\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i
      ) ||
      response.match(
        /####\s*Ожидаемый результат:\s*([\s\S]+?)(?=\n####|\n\*\*|\n\n|$)/i
      ) ||
      response.match(
        /Ожидаемый результат:\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i
      );

    const actualMatch =
      response.match(
        /\*\*Фактический результат:\*\*\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i
      ) ||
      response.match(
        /####\s*Фактический результат:\s*([\s\S]+?)(?=\n####|\n\*\*|\n\n|$)/i
      ) ||
      response.match(
        /Фактический результат:\s*([\s\S]+?)(?=\n\*\*|\n####|\n\n|$)/i
      );

    const environmentMatch =
      response.match(
        /\*\*Тестовое окружение[^:]*:\*\*\s*([\s\S]+?)(?=\n\n|\*\*|\n####|$)/i
      ) ||
      response.match(
        /####\s*Тестовое окружение[^:]*:\s*([\s\S]+?)(?=\n####|\n\*\*|\n\n|$)/i
      ) ||
      response.match(/Окружение[^:]*:\s*([\s\S]+?)(?=\n\n|\*\*|\n####|$)/i) ||
      response.match(/Environment[^:]*:\s*([\s\S]+?)(?=\n\n|\*\*|\n####|$)/i);

    // Извлекаем данные с улучшенной обработкой
    const title = titleMatch ? titleMatch[1].trim() : "Без названия";
    const description = descriptionMatch
      ? descriptionMatch[1].trim()
      : "Без описания";
    const steps = stepsMatch ? stepsMatch[1].trim() : "";
    const expected = expectedMatch ? expectedMatch[1].trim() : "";
    const actual = actualMatch ? actualMatch[1].trim() : "";
    const environment = environmentMatch
      ? environmentMatch[1].trim()
      : "Приложение: LTO 2.0, ОС: Android 10+, Оборудование: лазертаг система";

    // Если ответ слишком краткий, дополняем его
    let finalTitle = title;
    let finalDescription = description;
    let finalSteps = steps;
    let finalExpected = expected;
    let finalActual = actual;

    // Дополняем недостающие поля на основе имеющихся данных
    if (title !== "Без названия" && description === "Без описания") {
      finalDescription = `Обнаружена проблема: ${title.toLowerCase()}. Требуется детальное исследование для определения причин и способов устранения.`;
    }

    if (steps === "" && title !== "Без названия") {
      finalSteps = `1. Открыть приложение\n2. Воспроизвести условия для: ${title.toLowerCase()}\n3. Наблюдать за результатом`;
    }

    if (expected === "" && title !== "Без названия") {
      finalExpected = `Система должна работать корректно без проблем связанных с: ${title.toLowerCase()}`;
    }

    if (actual === "" && title !== "Без названия") {
      finalActual = `Наблюдается проблема: ${title.toLowerCase()}`;
    }

    return {
      index: 1,
      title: finalTitle,
      description: finalDescription,
      steps: finalSteps,
      expected: finalExpected,
      actual: finalActual,
      environment: environment,
    };
  }

  // Отправка запроса к GPT
  async sendToChatGPT(prompt) {
    try {
      // 1. Сначала пробуем OpenAI API
      const apiKey = config.OPENAI_API_KEY;

      if (apiKey && apiKey !== "your_openai_api_key_here") {
        console.log("Используем OpenAI API...");
        return await this.sendToOpenAI(prompt, apiKey);
      }

      // 2. Если OpenAI недоступен, пробуем g4f Python сервер
      console.log("OpenAI API не настроен, пробуем g4f Python сервер...");
      try {
        return await this.sendToG4FPython(prompt);
      } catch (g4fPythonError) {
        console.log("g4f Python не сработал:", g4fPythonError.message);
      }

      // 3. Fallback на g4f Node.js
      if (g4fClient) {
        console.log("Пробуем g4f Node.js как fallback...");
        try {
          return await this.sendToG4F(prompt);
        } catch (g4fError) {
          console.log("g4f Node.js не сработал:", g4fError.message);
        }
      }

      // 4. Пробуем локальный Ollama (Llama модели)
      if (ollama) {
        console.log("Пробуем Ollama (локальные Llama модели)...");
        try {
          return await this.sendToOllama(prompt);
        } catch (ollamaError) {
          console.log("Ollama не сработал:", ollamaError.message);
        }
      }

      // 5. Пробуем Hugging Face
      if (HfInference) {
        console.log("Пробуем Hugging Face...");
        try {
          return await this.sendToHuggingFace(prompt);
        } catch (hfError) {
          console.log("Hugging Face не сработал:", hfError.message);
        }
      }

      // 6. Пробуем Replicate (Llama через облако)
      if (Replicate) {
        console.log("Пробуем Replicate (облачные Llama модели)...");
        try {
          return await this.sendToReplicate(prompt);
        } catch (replicateError) {
          console.log("Replicate не сработал:", replicateError.message);
        }
      }

      // 7. Fallback на заглушку
      console.log("Ни один провайдер не доступен, используем заглушку...");
      return await this.sendMockResponse(prompt);
    } catch (error) {
      console.error("Ошибка при запросе к GPT:", error.message);
      // Fallback на заглушку в случае ошибки
      console.log("Переключаемся на заглушку из-за ошибки...");
      return await this.sendMockResponse(prompt);
    }
  }

  // Моковый ответ (заглушка)
  async sendMockResponse(prompt) {
    // Извлекаем описание бага из промпта для более реалистичного ответа
    const bugDescription =
      prompt.split("Вот мое описание бага:")[1]?.trim() ||
      "Неизвестная проблема";

    const mockResponse = `**Название:** ${
      bugDescription.length > 50
        ? bugDescription.substring(0, 50) + "..."
        : bugDescription
    }

**Описание:** Подробное описание проблемы: ${bugDescription}

**Шаги для воспроизведения (STR):**
1. Открыть приложение
2. Выполнить действие, описанное пользователем
3. Наблюдать проблему

**Ожидаемый результат:**
Приложение должно работать корректно без ошибок.

**Фактический результат:**
${bugDescription}

**Тестовое окружение (Environment):**
Версия приложения: 1.0
Версия устройства/прошивки: Windows 10`;

    const bugData = this.extractBugData(mockResponse);
    return [bugData];
  }

  // Реальная интеграция с OpenAI API (для будущего использования)
  async sendToOpenAI(prompt, apiKey) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const content = response.data.choices[0].message.content;
      const bugData = this.extractBugData(content);
      return [bugData];
    } catch (error) {
      console.error(
        "Ошибка OpenAI API:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // Бесплатный провайдер g4f
  // G4F через Python сервер (более стабильно)
  async sendToG4FPython(prompt) {
    try {
      console.log("Отправляем запрос через g4f Python сервер...");

      // Сначала проверяем здоровье Python сервера
      try {
        console.log(
          "Проверяем доступность сервера на http://127.0.0.1:5000/health..."
        );
        const healthResponse = await axios.get("http://127.0.0.1:5000/health", {
          timeout: 10000, // Увеличиваем таймаут до 10 секунд
        });
        console.log("✅ G4F Python сервер доступен:", healthResponse.data);
      } catch (healthError) {
        console.error(
          "❌ Ошибка подключения к Python серверу:",
          healthError.message
        );
        if (healthError.code === "ECONNREFUSED") {
          throw new Error(
            "G4F Python сервер недоступен. Запустите: python g4f_server.py"
          );
        } else if (healthError.code === "ETIMEDOUT") {
          throw new Error("Таймаут подключения к G4F Python серверу");
        } else {
          throw new Error(`Ошибка G4F Python сервера: ${healthError.message}`);
        }
      }

      // Отправляем запрос на Python сервер
      console.log("Отправляем POST запрос на /chat...");
      const response = await Promise.race([
        axios.post(
          "http://127.0.0.1:5000/chat",
          {
            prompt: BASE_PROMPT + prompt,
            model: "gpt-4",
          },
          {
            timeout: 120000, // Увеличиваем до 2 минут
            headers: {
              "Content-Type": "application/json",
            },
          }
        ),
        // Таймаут 120 секунд
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout после 120 сек")), 120000)
        ),
      ]);

      if (response.data && response.data.success && response.data.response) {
        const content = response.data.response;
        console.log(
          `✅ Успешный ответ от g4f Python (${response.data.provider})`
        );
        console.log("Ответ:", content.substring(0, 200) + "...");
        const bugData = this.extractBugData(content);
        return [bugData];
      } else {
        throw new Error(
          response.data?.error || "Пустой ответ от g4f Python сервера"
        );
      }
    } catch (error) {
      console.error("Ошибка g4f Python сервера:", error.message);
      throw error;
    }
  }

  async sendToG4F(prompt) {
    try {
      console.log("Отправляем запрос через g4f (новый API)...");

      // Пробуем новый API клиент
      if (g4fClient && g4fClient.chat && g4fClient.chat.completions) {
        console.log("Используем новый g4f Client API...");

        const response = await Promise.race([
          g4fClient.chat.completions.create({
            model: "gpt-4o-mini", // или "gpt-4", "gpt-3.5-turbo"
            messages: [
              {
                role: "user",
                content: BASE_PROMPT + prompt,
              },
            ],
            web_search: false,
          }),
          // Таймаут 45 секунд
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout после 45 сек")), 45000)
          ),
        ]);

        if (
          response &&
          response.choices &&
          response.choices[0] &&
          response.choices[0].message
        ) {
          const content = response.choices[0].message.content;
          if (content && content.trim()) {
            console.log("✅ Успешный ответ от g4f (новый API)");
            console.log("Ответ:", content.substring(0, 200) + "...");
            const bugData = this.extractBugData(content);
            return [bugData];
          }
        }
      }

      // Fallback на старый API если новый не работает
      console.log("Новый API не сработал, пробуем старый g4f API...");

      // Получаем список рабочих провайдеров (для старого API)
      const potentialProviders = [
        "GPT",
        "Bing",
        "ChatGPT",
        "OpenaiChat",
        "You",
        "Phind",
        "Theb",
      ];
      const workingProviders = potentialProviders.filter((name) => {
        const provider = g4fClient.providers && g4fClient.providers[name];
        const isWorking =
          provider && provider.working && provider.type === "ChatCompletion";
        console.log(
          `Провайдер ${name}: ${isWorking ? "доступен" : "недоступен"}`
        );
        return isWorking;
      });

      console.log(`Найдено рабочих провайдеров: ${workingProviders.length}`);

      for (const providerName of workingProviders) {
        try {
          const provider = g4fClient.providers[providerName];
          console.log(
            `Пробуем провайдер: ${providerName} (${provider.default_model})...`
          );

          const response = await Promise.race([
            g4fClient.chatCompletion(
              [
                {
                  role: "user",
                  content: BASE_PROMPT + prompt,
                },
              ],
              {
                provider: provider,
                model: provider.default_model || "gpt-4",
              }
            ),
            // Таймаут 30 секунд
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout после 30 сек")), 30000)
            ),
          ]);

          if (response && typeof response === "string" && response.trim()) {
            console.log(`✅ Успешный ответ от ${providerName}`);
            console.log("Ответ:", response.substring(0, 200) + "...");
            const bugData = this.extractBugData(response);
            return [bugData];
          } else {
            console.log(`❌ Пустой ответ от ${providerName}`);
          }
        } catch (providerError) {
          console.log(
            `❌ Ошибка провайдера ${providerName}:`,
            providerError.message
          );
          continue;
        }
      }

      throw new Error("Все g4f провайдеры недоступны");
    } catch (error) {
      console.error("Ошибка g4f:", error.message);
      throw error;
    }
  }

  // Альтернативные бесплатные провайдеры (как в Python коде)
  async sendToFreeProvider(prompt) {
    try {
      if (g4fClient) {
        return await this.sendToG4F(prompt);
      } else {
        console.log("g4f не доступен, используем заглушку...");
        return await this.sendMockResponse(prompt);
      }
    } catch (error) {
      console.log("Ошибка бесплатного провайдера, используем заглушку...");
      return await this.sendMockResponse(prompt);
    }
  }

  // Локальный Ollama (для Llama моделей)
  async sendToOllama(prompt) {
    try {
      console.log("Подключаемся к локальному Ollama...");

      // Используем специальный промпт для Llama моделей
      const llamaPrompt = LLAMA_PROMPT + prompt;

      // Список популярных Llama моделей для попыток (лучшие первыми)
      const models = [
        "llama3:8b", // Качественная модель для русского языка
        "llama3.2:1b", // Быстрая и легкая модель
        "llama2:7b",
        "llama2:13b",
        "llama2",
        "codellama:7b",
        "codellama",
        "mistral:7b",
        "mistral",
      ];

      for (const model of models) {
        try {
          console.log(`Пробуем модель: ${model}...`);

          const response = await Promise.race([
            ollama.generate({
              model: model,
              prompt: llamaPrompt, // Используем специальный промпт
              stream: false,
              options: {
                num_predict: 1000, // Увеличиваем лимит для подробных ответов
                temperature: 0.4, // Чуть выше для креативности но с контролем
                top_p: 0.9,
                top_k: 40,
                repeat_penalty: 1.15, // Выше против повторов
                stop: ["\n\n\n", "###", "---"], // Останавливаемся на больших разрывах
                presence_penalty: 0.1, // Поощряем разнообразие
                frequency_penalty: 0.1, // Против повторных фраз
              },
            }),
            new Promise(
              (_, reject) =>
                setTimeout(
                  () => reject(new Error("Timeout после 120 сек")),
                  120000
                ) // Больше времени для подробного ответа
            ),
          ]);

          if (response && response.response && response.response.trim()) {
            console.log(`✅ Успешный ответ от Ollama (${model})`);
            console.log("Ответ:", response.response.substring(0, 200) + "...");
            const bugData = this.extractBugData(response.response);
            return [bugData];
          }
        } catch (modelError) {
          console.log(`❌ Модель ${model} недоступна: ${modelError.message}`);
          continue;
        }
      }

      throw new Error("Все Ollama модели недоступны");
    } catch (error) {
      console.error("Ошибка Ollama:", error.message);
      throw error;
    }
  }

  // Hugging Face API (бесплатный)
  async sendToHuggingFace(prompt) {
    try {
      console.log("Отправляем запрос через Hugging Face...");

      // Можно добавить HF токен в .env если нужно
      const hfToken = process.env.HUGGINGFACE_TOKEN;
      const hf = new HfInference(hfToken);

      // Список доступных моделей
      const models = [
        "microsoft/DialoGPT-medium",
        "facebook/blenderbot-400M-distill",
        "microsoft/DialoGPT-small",
      ];

      for (const model of models) {
        try {
          console.log(`Пробуем HF модель: ${model}...`);

          const response = await Promise.race([
            hf.textGeneration({
              model: model,
              inputs: prompt,
              parameters: {
                max_new_tokens: 500,
                temperature: 0.7,
                return_full_text: false,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout после 30 сек")), 30000)
            ),
          ]);

          if (
            response &&
            response.generated_text &&
            response.generated_text.trim()
          ) {
            console.log(`✅ Успешный ответ от Hugging Face (${model})`);
            console.log(
              "Ответ:",
              response.generated_text.substring(0, 200) + "..."
            );
            const bugData = this.extractBugData(response.generated_text);
            return [bugData];
          }
        } catch (modelError) {
          console.log(
            `❌ HF модель ${model} недоступна: ${modelError.message}`
          );
          continue;
        }
      }

      throw new Error("Все Hugging Face модели недоступны");
    } catch (error) {
      console.error("Ошибка Hugging Face:", error.message);
      throw error;
    }
  }

  // Replicate API (облачные Llama модели)
  async sendToReplicate(prompt) {
    try {
      console.log("Отправляем запрос через Replicate...");

      // Replicate требует токен, но можно попробовать без него для некоторых моделей
      const replicateToken = process.env.REPLICATE_API_TOKEN;
      const replicate = new Replicate({
        auth: replicateToken,
      });

      // Список доступных Llama моделей
      const models = [
        "meta/llama-2-7b-chat",
        "meta/llama-2-13b-chat",
        "meta/codellama-7b-instruct",
      ];

      for (const model of models) {
        try {
          console.log(`Пробуем Replicate модель: ${model}...`);

          const response = await Promise.race([
            replicate.run(model, {
              input: {
                prompt: prompt,
                max_new_tokens: 500,
                temperature: 0.7,
                top_p: 0.9,
                repetition_penalty: 1,
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Timeout после 60 сек")), 60000)
            ),
          ]);

          if (response && Array.isArray(response) && response.length > 0) {
            const text = response.join("").trim();
            if (text) {
              console.log(`✅ Успешный ответ от Replicate (${model})`);
              console.log("Ответ:", text.substring(0, 200) + "...");
              const bugData = this.extractBugData(text);
              return [bugData];
            }
          }
        } catch (modelError) {
          console.log(
            `❌ Replicate модель ${model} недоступна: ${modelError.message}`
          );
          continue;
        }
      }

      throw new Error("Все Replicate модели недоступны");
    } catch (error) {
      console.error("Ошибка Replicate:", error.message);
      throw error;
    }
  }
}

module.exports = new GPTService();
