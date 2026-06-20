const USE_MOCK = true;

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

export const getUsers = async () => {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_USERS;
  }
  const response = await fetch('/api/users');
  return response.json();
};

export const updateUser = async (userId: number, data: any) => {
  if (USE_MOCK) {
    await delay(300);
    const user = MOCK_USERS.find(u => u.id === userId);
    if (!user) throw new Error('Пользователь не найден');
    Object.assign(user, data);
    return user;
  }
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getProjects = async () => {
  if (USE_MOCK) {
    await delay(300);
    return MOCK_PROJECTS;
  }
  const response = await fetch('/api/projects');
  return response.json();
};

export const createProject = async (data: any) => {
  if (USE_MOCK) {
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
  }
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getUserProfile = async (userId: number) => {
  if (USE_MOCK) {
    await delay(300);
    return { ...MOCK_USER_PROFILE, id: userId };
  }
  const response = await fetch(`/api/users/${userId}/profile`);
  return response.json();
};

export const getTasks = async (projectId?: number) => {
  if (USE_MOCK) {
    await delay(400);
    return MOCK_TASKS;
  }
  const url = projectId ? `/api/tasks?projectId=${projectId}` : '/api/tasks';
  const response = await fetch(url);
  return response.json();
};

export const login = async (username: string, password: string) => {
  if (USE_MOCK) {
    await delay(500);
    const user = MOCK_USERS.find(u => u.username === username);
    if (!user) {
      throw new Error('Неверное имя пользователя или пароль');
    }
    return { user, token: 'mock-jwt-token-' + Date.now() };
  }
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const isMockMode = USE_MOCK;