import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.environ["BOT_TOKEN"]

CAESAR_API_BASE = os.environ["CAESAR_API_BASE"].rstrip("/")
CAESAR_BOT_SECRET = os.environ["CAESAR_BOT_SECRET"]

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

# Лимит символов JSON-контекста, чтобы не вылететь по токенам.
# ~4 символа = 1 токен. 48000 символов ≈ 12k токенов на данные.
MAX_CONTEXT_CHARS = 48_000
