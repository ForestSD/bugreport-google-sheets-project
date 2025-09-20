#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
G4F Python сервер для Node.js бота
Этот сервер предоставляет HTTP API для доступа к g4f из Node.js
"""

from flask import Flask, request, jsonify
import g4f
import traceback
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Список провайдеров для попыток (проверенные рабочие)
PROVIDERS = [
    g4f.Provider.Bing,
    g4f.Provider.You,
    g4f.Provider.ChatgptFree,
    g4f.Provider.FreeGpt,
    g4f.Provider.OpenaiChat,
    g4f.Provider.ChatgptAi,
    g4f.Provider.Aichat,
    g4f.Provider.ChatForAi,
]

@app.route('/health', methods=['GET'])
def health_check():
    """Проверка здоровья сервера"""
    return jsonify({"status": "ok", "service": "g4f-server"})

@app.route('/chat', methods=['POST'])
def chat_completion():
    """Основной endpoint для генерации ответов через g4f"""
    try:
        data = request.get_json()
        
        if not data or 'prompt' not in data:
            return jsonify({"error": "Prompt is required"}), 400
            
        prompt = data['prompt']
        model = data.get('model', 'gpt-4')
        
        logger.info(f"Получен запрос: {prompt[:100]}...")
        
        # Пробуем разные провайдеры
        for provider in PROVIDERS:
            try:
                logger.info(f"Пробуем провайдер: {provider.__name__}")
                
                response = g4f.ChatCompletion.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    provider=provider,
                    timeout=60
                )
                
                if response and response.strip():
                    logger.info(f"✅ Успешный ответ от {provider.__name__}")
                    return jsonify({
                        "success": True,
                        "response": response,
                        "provider": provider.__name__
                    })
                else:
                    logger.warning(f"❌ Пустой ответ от {provider.__name__}")
                    
            except Exception as e:
                logger.error(f"❌ Ошибка провайдера {provider.__name__}: {str(e)}")
                continue
        
        # Если все провайдеры не сработали
        return jsonify({
            "success": False,
            "error": "Все провайдеры недоступны"
        }), 503
        
    except Exception as e:
        logger.error(f"Ошибка сервера: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/providers', methods=['GET'])
def list_providers():
    """Список доступных провайдеров"""
    provider_status = []
    
    for provider in PROVIDERS:
        try:
            # Простая проверка провайдера
            status = "unknown"
            provider_status.append({
                "name": provider.__name__,
                "status": status
            })
        except Exception as e:
            provider_status.append({
                "name": provider.__name__,
                "status": "error",
                "error": str(e)
            })
    
    return jsonify({"providers": provider_status})

if __name__ == '__main__':
    print("🚀 Запуск G4F Python сервера...")
    print("📡 API будет доступен на http://localhost:5000")
    print("🔍 Endpoints:")
    print("  - GET  /health     - проверка здоровья")
    print("  - POST /chat       - генерация ответов")
    print("  - GET  /providers  - список провайдеров")
    
    app.run(host='0.0.0.0', port=5000, debug=False)