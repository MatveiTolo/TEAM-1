import json

from openai import AsyncOpenAI

from config import OPENAI_API_KEY, OPENAI_MODEL, MAX_CONTEXT_CHARS

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Системный промпт = объяснение данных, которые получили с бэкенда.
# Именно это "объяснение данных" + JSON + вопрос уходит в GPT-4o.
SYSTEM_PROMPT = """Ты — ассистент внутри канбан-доски CAESAR.

Тебе дают JSON с контекстом конкретного пользователя. Структура:
- user: {id, userName, email} — кто задаёт вопрос.
- projects[]: проекты, в которых пользователь участвует.
  - role: его роль в проекте: GlobalAdmin | PageAdmin | Developer | Tester | Viewer.
  - permissions[]: его права, выведенные из роли (task.create, task.move, task.assign и т.д.).
  - allowedPageId: если задано — доступ ограничен этой страницей (доской).
  - tasks[]: ТОЛЬКО задачи, где пользователь создатель ИЛИ исполнитель:
      - pageName: доска (страница), на которой задача.
      - status: этап канбана — Preparaion | Execution | Testing | Done.
      - deadline (UTC), createdAtUtc, updatedAtUtc, position.
      - assignee: кто исполняет (может быть null).
      - createdBy: кто создал/назначил задачу.
      - userRelation: связь пользователя с задачей — creator | assignee | creator+assignee.
      - history[]: история по времени:
          {atUtc, changedBy, actionType, statusBefore, statusAfter, details}.

Правила ответа:
1. Отвечай ТОЛЬКО на основе данных в JSON. Не выдумывай задачи, людей, даты.
2. Если данных для ответа нет — прямо скажи, что в доступных данных этого нет.
3. Даты в JSON в UTC. Если считаешь «просрочено / сколько осталось» — ориентируйся на текущую дату из контекста запроса.
4. Отвечай кратко и по делу, на русском. Где уместно — списком или таблицей.
5. Учитывай права пользователя: если он Viewer и спрашивает, может ли что-то изменить — скажи по permissions.
"""


def _trim(context: dict) -> str:
    """JSON в строку с обрезкой по лимиту символов (защита от лимита токенов)."""
    raw = json.dumps(context, ensure_ascii=False, separators=(",", ":"))
    if len(raw) <= MAX_CONTEXT_CHARS:
        return raw
    # грубая обрезка: режем историю задач, она самая объёмная
    for p in context.get("projects", []):
        for t in p.get("tasks", []):
            if isinstance(t.get("history"), list) and len(t["history"]) > 5:
                t["history"] = t["history"][-5:]  # оставляем последние 5 изменений
    raw = json.dumps(context, ensure_ascii=False, separators=(",", ":"))
    return raw[:MAX_CONTEXT_CHARS]


async def answer(question: str, context: dict, now_utc_iso: str) -> str:
    context_json = _trim(context)
    user_content = (
        f"Текущее время (UTC): {now_utc_iso}\n\n"
        f"ДАННЫЕ ПОЛЬЗОВАТЕЛЯ (JSON):\n{context_json}\n\n"
        f"ВОПРОС ПОЛЬЗОВАТЕЛЯ:\n{question}"
    )

    resp = await client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
    )
    return resp.choices[0].message.content.strip()
