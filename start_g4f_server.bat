@echo off
echo Запуск G4F Python сервера...
echo.

:: Проверяем Python
python --version >nul 2>&1
if errorlevel 1 (
 echo Python не найден! Установите Python 3.10+
 pause
 exit /b 1
)

:: Устанавливаем зависимости если нужно
if not exist "g4f_venv" (
 echo Создаем виртуальное окружение...
 python -m venv g4f_venv
)

:: Активируем виртуальное окружение
call g4f_venv\Scripts\activate.bat

:: Устанавливаем/обновляем зависимости
echo Устанавливаем зависимости...
pip install -r g4f_requirements.txt

:: Запускаем сервер
echo Запускаем G4F сервер на порту 5000...
echo API будет доступен на http://localhost:5000
echo.
echo Для остановки нажмите Ctrl+C
echo.

python g4f_server.py

pause