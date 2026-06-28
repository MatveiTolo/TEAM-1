import sqlite3
from contextlib import closing

DB_PATH = "bot.db"


def init() -> None:
    with closing(sqlite3.connect(DB_PATH)) as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                user_id     TEXT NOT NULL,
                full_name   TEXT,
                jwt         TEXT NOT NULL
            )
            """
        )
        c.commit()


def save_link(telegram_id: int, user_id: str, full_name: str, jwt: str) -> None:
    with closing(sqlite3.connect(DB_PATH)) as c:
        c.execute(
            "REPLACE INTO users (telegram_id, user_id, full_name, jwt) VALUES (?,?,?,?)",
            (telegram_id, user_id, full_name, jwt),
        )
        c.commit()


def get_jwt(telegram_id: int) -> str | None:
    with closing(sqlite3.connect(DB_PATH)) as c:
        row = c.execute(
            "SELECT jwt FROM users WHERE telegram_id = ?", (telegram_id,)
        ).fetchone()
        return row[0] if row else None


def delete_link(telegram_id: int) -> None:
    with closing(sqlite3.connect(DB_PATH)) as c:
        c.execute("DELETE FROM users WHERE telegram_id = ?", (telegram_id,))
        c.commit()
