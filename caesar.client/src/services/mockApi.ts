// src/services/mockApi.ts
// Реальный API клиент, взаимодействующий с бэкендом

import { getToken } from '../context/ApiContext';

const API_BASE = '/api';

export const getUsers = async () => {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  if (!res.ok) return MOCK_USERS;
  return res.json();
};

export const updateUser = async (userId: number, data: any) => {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}` 
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Ошибка обновления пользователя');
  return res.json();
};

export const getProjects = async () => {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('🔥 Реальные проекты с бэкенда:', data);
      return data;
    }
  } catch (e) {
    console.warn('⚠️ Не удалось загрузить проекты с бэкенда, использую мок:', e);
  }
  
  return MOCK_PROJECTS;
};

export const createProject = async (data: any) => {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}` 
      },
      body: JSON.stringify(data),
    });
    
    if (res.ok) {
      const result = await res.json();
      console.log('✅ Проект успешно создан на бэкенде:', result);
      return result;
    }
  } catch (e) {
    console.warn('⚠️ Не удалось создать проект на бэкенде, создаю локально (мок):', e);
  }

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
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  if (!res.ok) return { ...MOCK_USER_PROFILE, id: userId };
  return res.json();
};

export const getTasks = async (projectId?: number) => {
  const url = projectId ? `${API_BASE}/tasks?projectId=${projectId}` : `${API_BASE}/tasks`;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${getToken()}` },
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('⚠️ Не удалось загрузить задачи, использую мок:', e);
  }
  return MOCK_TASKS;
};

export const createTask = async (data: any) => {
  try {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}` 
      },
      body: JSON.stringify(data),
    });
    if (res.ok) return res.json();
  } catch (e) {
    console.warn('⚠️ Не удалось создать задачу на бэкенде, создаю локально:', e);
  }

  const newTask = { id: Date.now(), ...data };
  MOCK_TASKS.push(newTask);
  return newTask;
};

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
    try { return JSON.parse(text); } catch { return { success: true, message: text }; }
  }
  try { const errorJson = JSON.parse(text); throw new Error(errorJson.message || errorJson.title || 'Ошибка регистрации'); } 
  catch { throw new Error(text || 'Ошибка регистрации'); }
};

export const isMockMode = false;