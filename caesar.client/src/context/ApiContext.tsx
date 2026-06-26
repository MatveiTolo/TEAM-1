import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import * as mockApi from '../services/mockApi';

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (ЭКСПОРТИРУЕМ ИХ!) ---
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
// --- КОНЕЦ ЭКСПОРТА ---

export interface ApiService {
  getUsers: typeof mockApi.getUsers;
  updateUser: typeof mockApi.updateUser;
  getProjects: typeof mockApi.getProjects;
  createProject: typeof mockApi.createProject;
  getUserProfile: typeof mockApi.getUserProfile;
  getTasks: typeof mockApi.getTasks;
  createTask: typeof mockApi.createTask;
  login: typeof mockApi.login;
  register: typeof mockApi.register;
  isMockMode: boolean;
}

const ApiContext = createContext<ApiService | null>(null);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const api: ApiService = {
    getUsers: mockApi.getUsers,
    updateUser: mockApi.updateUser,
    getProjects: mockApi.getProjects,
    createProject: mockApi.createProject,
    getUserProfile: mockApi.getUserProfile,
    getTasks: mockApi.getTasks,
    createTask: mockApi.createTask,
    login: mockApi.login,
    register: mockApi.register,
    isMockMode: mockApi.isMockMode,
  };

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};