export async function sendToChatGPT(prompt) {
  const API_URL = "http://127.0.0.1:5000/api/chat";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    console.log("Статус ответа от сервера:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("Ошибка ответа:", error.error || "Неизвестная ошибка");
      return null;
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error("Ошибка при отправке запроса:", error.message);
    return null;
  }
}
