# syntax=docker/dockerfile:1
# ----------------------------------------------------------------------------
# CAESAR Telegram-бот (aiogram + OpenAI). Long-polling, состояние в SQLite.
# Для облака смонтируйте том на /data, чтобы привязки переживали рестарты.
# ----------------------------------------------------------------------------
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    BOT_DB_PATH=/data/bot.db

WORKDIR /app

# Зависимости отдельным слоем для кэша
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Исходный код бота
COPY . .

# Каталог для SQLite-базы (том в проде)
RUN mkdir -p /data \
    && adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app /data
USER appuser

VOLUME ["/data"]

CMD ["python", "bot.py"]
