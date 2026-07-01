import httpx

from config import CAESAR_API_BASE, CAESAR_BOT_SECRET


class CaesarError(Exception):
    pass


class AuthExpired(CaesarError):
    """JWT истёк/невалиден — нужно перепривязать."""


async def link_telegram(code: str, telegram_id: int) -> dict:
    """Подтверждает одноразовый код, возвращает {jwt, userId, fullName}."""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{CAESAR_API_BASE}/api/telegram/link",
            headers={"X-Bot-Secret": CAESAR_BOT_SECRET},
            json={"code": code, "telegramId": telegram_id},
        )
        if r.status_code == 400:
            raise CaesarError("code_invalid_or_expired")
        r.raise_for_status()
        data = r.json()
        return {
            "jwt": data["jwt"],
            "user_id": str(data["userId"]),
            "full_name": data.get("userName") or data.get("fullName", ""),
        }


async def get_context(jwt: str) -> dict:
    """Тянет агрегированный контекст пользователя из CAESAR."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{CAESAR_API_BASE}/api/assistant/context",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        if r.status_code == 401:
            raise AuthExpired()
        r.raise_for_status()
        return r.json()


async def get_task(jwt: str, task_id: int) -> dict:
    """Одна задача по id — для команды /status {id}."""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(
            f"{CAESAR_API_BASE}/api/tasks/{task_id}",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        if r.status_code == 401:
            raise AuthExpired()
        if r.status_code == 404:
            raise CaesarError("task_not_found")
        if r.status_code in (403, 400):
            raise CaesarError("forbidden")
        r.raise_for_status()
        return r.json()


async def move_task(jwt: str, task_id: int, target_status: int, new_position: int = 0) -> dict:
    """Переместить задачу в соседнюю колонку (интерактивные кнопки, раздел 9.1)."""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.put(
            f"{CAESAR_API_BASE}/api/tasks/{task_id}/move",
            headers={"Authorization": f"Bearer {jwt}"},
            json={"targetTaskStatus": target_status, "newPosition": new_position},
        )
        if r.status_code == 401:
            raise AuthExpired()
        if r.status_code == 400:
            raise CaesarError("move_not_allowed")
        r.raise_for_status()
        return r.json()


async def first_page_id(jwt: str) -> int | None:
    """Первая доступная доска первого проекта — для быстрого /new."""
    async with httpx.AsyncClient(timeout=20) as client:
        pr = await client.get(
            f"{CAESAR_API_BASE}/api/Projects",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        if pr.status_code == 401:
            raise AuthExpired()
        pr.raise_for_status()
        projects = pr.json()
        if not projects:
            return None
        project_id = projects[0].get("id")

        pg = await client.get(
            f"{CAESAR_API_BASE}/api/ProjectPages/project/{project_id}",
            headers={"Authorization": f"Bearer {jwt}"},
        )
        pg.raise_for_status()
        pages = pg.json()
        return pages[0].get("id") if pages else None


async def create_task(jwt: str, page_id: int, title: str, deadline: str | None = None) -> dict:
    """Создать задачу через бота (команда /new)."""
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.post(
            f"{CAESAR_API_BASE}/api/tasks",
            headers={"Authorization": f"Bearer {jwt}"},
            json={"projectPageId": page_id, "title": title, "description": "", "deadline": deadline},
        )
        if r.status_code == 401:
            raise AuthExpired()
        r.raise_for_status()
        return r.json()
