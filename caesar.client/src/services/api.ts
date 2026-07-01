// services/api.ts
import axios, { type AxiosResponse, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'http://localhost:5254/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерсептор для добавления токена авторизации
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('caesar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерсептор для обработки ошибок
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('caesar_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================
export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/Auth/Login', { email, password });
  return response.data;
};

export const register = async (username: string, email: string, password: string) => {
  const response = await apiClient.post('/Auth/register', { username, email, password });
  return response.data;
};

// ============================================================
// USERS
// ============================================================
export const getUsers = () => apiClient.get('/Users');
export const getCurrentUser = () => apiClient.get('/Users/me');
export const updateProfile = (data: { userName: string; email: string }) =>
  apiClient.put('/Users/profile', data);
export const updateUser = (id: number, data: { userName: string; email: string }) =>
  apiClient.patch(`/Users/${id}`, data);
export const deleteUser = (id: number) => apiClient.delete(`/Users/${id}`);
export const bindNotification = (data: { provider: string; providerUserId: string }) =>
  apiClient.post('/Users/notification', data);

// ============================================================
// PROJECTS
// ============================================================
export const getProjects = () => apiClient.get('/Projects');
export const createProject = (data: { name: string; theme: string | null }) =>
  apiClient.post('/Projects', data);

// ============================================================
// PROJECT PAGES
// ============================================================
export const getProjectPages = (projectId: number) =>
  apiClient.get(`/ProjectPages/project/${projectId}`);
export const createProjectPage = (data: { name: string; projectId: number }) =>
  apiClient.post('/ProjectPages', data);

// ============================================================
// TASKS
// ============================================================
export const getTasksByPage = (pageId: number) =>
  apiClient.get(`/Tasks/page/${pageId}`);
// Задача 4: все задачи проекта (по всем доскам) — для календаря и отчётов.
export const getTasksByProject = (projectId: number) =>
  apiClient.get(`/Tasks/project/${projectId}`);
export const createTask = (data: {
  projectPageId: number;
  title: string;
  description: string | null;
  deadline: string | null;
}) => apiClient.post('/Tasks', data);
export const moveTask = (id: number, data: { targetTaskStatus: number; newPosition: number }) =>
  apiClient.put(`/Tasks/${id}/move`, data);
export const updateTask = (id: number, data: {
  title: string | null;
  description: string | null;
  deadline: string | null;
  assignedToId: number | null;
}) => apiClient.patch(`/Tasks/${id}`, data);
export const deleteTask = (id: number) => apiClient.delete(`/Tasks/${id}`);
export const getTaskHistory = (id: number) => apiClient.get(`/Tasks/${id}/history`);
export const createComment = (id: number, data: { text: string }) =>
  apiClient.post(`/Tasks/${id}/comments`, data);
export const getComments = (id: number) => apiClient.get(`/Tasks/${id}/comments`);

// ============================================================
// MEMBERS & ROLES (роли по проектам — Задача 6)
// ============================================================
export const getRoles = () => apiClient.get('/roles');
export const getProjectMembers = (projectId: number) =>
  apiClient.get(`/projects/${projectId}/members`);
export const addProjectMember = (
  projectId: number,
  data: { email: string; roleId: number; allowedPageId: number | null },
) => apiClient.post(`/projects/${projectId}/members`, data);
export const updateProjectMember = (
  projectId: number,
  userId: number,
  data: { roleId?: number; allowedPageId?: number | null },
) => apiClient.patch(`/projects/${projectId}/members/${userId}`, data);
export const removeProjectMember = (projectId: number, userId: number) =>
  apiClient.delete(`/projects/${projectId}/members/${userId}`);

// ============================================================
// ADMIN (блокировка пользователей — Задача 5)
// ============================================================
export const blockUser = (id: number) => apiClient.post(`/Users/${id}/block`);
export const unblockUser = (id: number) => apiClient.post(`/Users/${id}/unblock`);

// ============================================================
// TELEGRAM (код подключения бота — Задача 7)
// ============================================================
export const getTelegramLinkCode = () => apiClient.post('/telegram/link-code');

// ============================================================
// AI (документированный ассистент — POST /api/ai/chat)
// ============================================================
export const aiChat = (message: string) => apiClient.post('/ai/chat', { message });

// ============================================================
// ЭКСПОРТ ВСЕХ МЕТОДОВ ЧЕРЕЗ ОБЪЕКТ api
// ============================================================
export const api = {
  // Auth
  login,
  register,
  // Users
  getUsers,
  getCurrentUser,
  updateProfile,
  updateUser,
  deleteUser,
  bindNotification,
  // Projects
  getProjects,
  createProject,
  // Project Pages
  getProjectPages,
  createProjectPage,
  // Tasks
  getTasksByPage,
  getTasksByProject,
  createTask,
  moveTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  createComment,
  getComments,
  // Members & roles
  getRoles,
  getProjectMembers,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
  // Admin
  blockUser,
  unblockUser,
  // Telegram
  getTelegramLinkCode,
  // AI
  aiChat,
};