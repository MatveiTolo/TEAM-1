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
  console.log('📥 Ответ сервера (регистрация):', text);

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
  
  console.log('📥 Загрузка задач для страницы:', pageId || 1);
  
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
  console.log('✅ Задачи загружены:', data);
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

  const response = await fetch(`/api/Tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
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

  return response.json();
};

// ---- МОК-ЗАГЛУШКА для комментариев (пока) ----
export const getComments = async (_taskId: number) => {
  await delay(300);
  return [
    { id: 1, user_name: 'Иван Петров', text: 'Первый комментарий', created_at: new Date().toISOString() },
    { id: 2, user_name: 'Мария Смирнова', text: 'Второй комментарий', created_at: new Date().toISOString() },
  ];
};

// ---- МОК-ЗАГЛУШКИ (пока без реального API) ----
export const getUsers = async () => {
  await delay(300);
  return MOCK_USERS;
};

export const getProjects = async () => {
  await delay(300);
  return MOCK_PROJECTS;
};

export const createProject = async (data: any) => {
  await delay(500);
  const newProject = {
    id: Date.now(),
    ...data,
    createdAt: new Date().toLocaleDateString('ru-RU'),
    tasksCount: 0,
    status: 'Активен',
  };
  MOCK_PROJECTS.push(newProject);
  return newProject;
};

export const getUserProfile = async (userId: number) => {
  await delay(300);
  return { ...MOCK_USER_PROFILE, id: userId };
};

export const createTask = async (data: any) => {
  await delay(400);
  const newTask = { id: Date.now(), ...data };
  MOCK_TASKS.push(newTask);
  return newTask;
};

export const updateUser = async (userId: number, data: any) => {
  await delay(300);
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user) throw new Error('Пользователь не найден');
  Object.assign(user, data);
  return user;
};

// ---- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ----
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isMockMode = true;