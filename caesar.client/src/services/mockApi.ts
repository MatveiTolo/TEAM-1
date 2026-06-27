// ============================================================
// 1. Вход и регистрация — РЕАЛЬНЫЙ API (с сохранением токена)
// 2. Все остальные запросы — пока МОК (заглушки)
// ============================================================

// ---- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ТОКЕНОМ ----
const TOKEN_KEY = 'caesar_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// ---- МОК-ДАННЫЕ (для остальных запросов) ----
export const MOCK_USERS = [
  { id: 1, username: 'admin', email: 'admin@example.com', role: 'Главный администратор', status: 'Активен' },
  { id: 2, username: 'developer', email: 'dev@example.com', role: 'Разработчик', status: 'Активен' },
  { id: 3, username: 'tester', email: 'tester@example.com', role: 'Тестировщик', status: 'Активен' },
  { id: 4, username: 'viewer', email: 'viewer@example.com', role: 'Наблюдатель', status: 'Заблокирован' },
];

export const MOCK_PROJECTS = [
  { id: 1, name: 'CAESAR Web App', theme: '💻 IT-проект', createdAt: '15.06.2026', role: 'Главный администратор', tasksCount: 12, status: 'Активен' },
  { id: 2, name: 'Маркетинговая кампания', theme: '📊 Маркетинг', createdAt: '16.06.2026', role: 'Маркетолог', tasksCount: 8, status: 'Активен' },
  { id: 3, name: 'Дизайн-система', theme: '🎨 Дизайн', createdAt: '17.06.2026', role: 'Дизайнер', tasksCount: 5, status: 'Активен' },
];

export const MOCK_USER_PROFILE = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  role: 'Главный администратор',
  createdAt: '01.01.2026',
  projectsCount: 4,
};

export const MOCK_TASKS = [
  { id: 1, title: 'Настроить прокси фронтенда', status: 'execution', deadline: '2026-06-17', assignee_name: 'Иван Петров' },
  { id: 2, title: 'Создать компонент колонки', status: 'preparation', deadline: '2026-06-15', assignee_name: null },
  { id: 3, title: 'Написать тесты для API', status: 'testing', deadline: '2026-06-18', assignee_name: 'Мария Смирнова' },
  { id: 4, title: 'Добавить Telegram уведомления', status: 'done', deadline: null, assignee_name: 'Иван Петров' },
];

// ---- РЕАЛЬНЫЙ API (АУТЕНТИФИКАЦИЯ) ----
export const login = async (email: string, password: string) => {
  const response = await fetch('/api/Auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка входа');
  }

  const data = await response.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await fetch('/api/Auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  const text = await response.text();

  if (response.ok) {
    try {
      return JSON.parse(text);
    } catch {
      return { success: true, message: text };
    }
  }

  try {
    const errorJson = JSON.parse(text);
    throw new Error(errorJson.message || errorJson.title || 'Ошибка регистрации');
  } catch {
    throw new Error(text || 'Ошибка регистрации');
  }
};

// ============================================================
// 2. ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ — РЕАЛЬНЫЙ API
// ============================================================

export const updateProfile = async (data: { username?: string; email?: string }) => {
  const token = getToken();
  if (!token) {
    throw new Error('Не авторизован');
  }

  const response = await fetch('/api/Users/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка обновления профиля');
  }

  return response.json();
};

// ============================================================
// 3. ЗАДАЧИ — РЕАЛЬНЫЙ API
// ============================================================

export const getTasks = async (pageId?: number) => {
  const token = getToken();
  if (!token) {
    throw new Error('Не авторизован');
  }

  const url = pageId ? `/api/Tasks/page/${pageId}` : '/api/Tasks/page/1';
  
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка загрузки задач');
  }

  const data = await response.json();
  return data;
};

export const updateTask = async (taskId: number, data: {
  title?: string;
  description?: string;
  deadline?: string | null;
  assigneeId?: number | null;
  status?: string;
}) => {
  const token = getToken();
  if (!token) {
    throw new Error('Не авторизован');
  }

  // Бэкенд (UpdateTaskDto) ожидает: title, description, deadline, assignedToId
  const payload: Record<string, unknown> = {
    title: data.title,
    description: data.description,
    deadline: data.deadline ? data.deadline : null,
    assignedToId: data.assigneeId ?? null,
  };

  const response = await fetch(`/api/Tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка обновления задачи');
  }

  return response.json();
};

export const deleteTask = async (taskId: number) => {
  const token = getToken();
  if (!token) {
    throw new Error('Не авторизован');
  }

  const response = await fetch(`/api/Tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка удаления задачи');
  }

  return response.json();
};

export const getTaskHistory = async (taskId: number) => {
  const token = getToken();
  if (!token) {
    throw new Error('Не авторизован');
  }

  const response = await fetch(`/api/Tasks/${taskId}/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка получения истории');
  }

  const raw = await response.json();
  // Бэкенд (TaskHistoryDto) → формат, который ждёт модалка
  return (raw || []).map((h: any) => ({
    user_name: h.username ?? h.user_name ?? 'Система',
    action: h.details || h.actionType || h.action || 'Действие',
    old_value: h.statusBeforeName,
    new_value: h.statusAfterName !== h.statusBeforeName ? h.statusAfterName : undefined,
    created_at: h.createdAt ?? h.created_at ?? '',
  }));
};

// ============================================================
// 4. КОММЕНТАРИИ / ПОЛЬЗОВАТЕЛИ / ПРОЕКТЫ — РЕАЛЬНЫЙ API
//    (с мок-фолбэком, чтобы UI оставался демонстрируемым без бэкенда)
// ============================================================

const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getComments = async (taskId: number) => {
  try {
    const response = await fetch(`/api/Tasks/${taskId}/comments`, {
      headers: { ...authHeaders() },
    });
    if (!response.ok) throw new Error('fallback');
    const raw = await response.json();
    // Бэкенд (CommentDto) → формат модалки
    return (raw || []).map((c: any) => ({
      id: c.id,
      user_name: c.username ?? c.user_name ?? 'Пользователь',
      text: c.text ?? '',
      created_at: c.createdAt ?? c.created_at ?? '',
    }));
  } catch {
    await delay(200);
    return [];
  }
};

export const addComment = async (taskId: number, text: string) => {
  const response = await fetch(`/api/Tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Ошибка добавления комментария');
  }
  const c = await response.json();
  return {
    id: c.id,
    user_name: c.username ?? 'Пользователь',
    text: c.text ?? text,
    created_at: c.createdAt ?? new Date().toISOString(),
  };
};

export const getUsers = async () => {
  try {
    const response = await fetch('/api/Users', { headers: { ...authHeaders() } });
    if (!response.ok) throw new Error('fallback');
    const raw = await response.json();
    return (raw || []).map((u: any) => ({
      id: u.id,
      username: u.username ?? u.userName ?? '',
      email: u.email ?? '',
    }));
  } catch {
    await delay(200);
    return MOCK_USERS;
  }
};

export const getProjects = async () => {
  try {
    const response = await fetch('/api/Projects', { headers: { ...authHeaders() } });
    if (!response.ok) throw new Error('fallback');
    const raw = await response.json();
    return (raw || []).map((p: any) => ({
      id: p.id,
      name: p.name ?? '',
      theme: p.theme ?? '',
      role: roleLabel(p.role),
      createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('ru-RU') : '',
      tasksCount: p.tasksCount ?? 0,
    }));
  } catch {
    await delay(200);
    return MOCK_PROJECTS;
  }
};

export const createProject = async (data: any) => {
  try {
    const response = await fetch('/api/Projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name: data.name, theme: data.theme }),
    });
    if (!response.ok) throw new Error('fallback');
    const p = await response.json();
    return {
      id: p.id,
      name: p.name ?? data.name,
      theme: p.theme ?? data.theme ?? '',
      role: 'Главный администратор',
      createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('ru-RU') : new Date().toLocaleDateString('ru-RU'),
      tasksCount: 0,
    };
  } catch {
    await delay(300);
    const newProject = {
      id: Date.now(),
      ...data,
      createdAt: new Date().toLocaleDateString('ru-RU'),
      tasksCount: 0,
      status: 'Активен',
    };
    MOCK_PROJECTS.push(newProject);
    return newProject;
  }
};

export const getUserProfile = async (userId: number) => {
  try {
    const response = await fetch('/api/Users/me', { headers: { ...authHeaders() } });
    if (!response.ok) throw new Error('fallback');
    const u = await response.json();
    return {
      id: u.id ?? userId,
      username: u.username ?? u.userName ?? '',
      email: u.email ?? '',
      role: 'Участник',
      createdAt: '—',
      projectsCount: u.projectsCount ?? 0,
    };
  } catch {
    await delay(200);
    return { ...MOCK_USER_PROFILE, id: userId };
  }
};

export const createTask = async (data: any) => {
  await delay(400);
  const newTask = { id: Date.now(), ...data };
  MOCK_TASKS.push(newTask);
  return newTask;
};

export const updateUser = async (userId: number, data: any) => {
  try {
    const response = await fetch(`/api/Users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ userName: data.username ?? data.userName, email: data.email }),
    });
    if (!response.ok) throw new Error('fallback');
    return response.json();
  } catch {
    await delay(200);
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) throw new Error('Пользователь не найден');
    Object.assign(user, data);
    return user;
  }
};

// Числовая роль участника (UserRole) → человекочитаемая подпись
const roleLabel = (role: number | string | undefined): string => {
  const map: Record<number, string> = {
    1: 'Главный администратор',
    2: 'Администратор страницы',
    3: 'Разработчик',
    4: 'Тестировщик',
    5: 'Наблюдатель',
  };
  if (typeof role === 'number') return map[role] ?? 'Участник';
  return (role as string) || 'Участник';
};

// ---- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isMockMode = true;