// src/context/ApiContext.tsx
import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import * as mockApi from '../services/mockApi';

export interface ApiService {
  getUsers: typeof mockApi.getUsers;
  updateUser: typeof mockApi.updateUser;
  getProjects: typeof mockApi.getProjects;
  createProject: typeof mockApi.createProject;
  getUserProfile: typeof mockApi.getUserProfile;
  getTasks: typeof mockApi.getTasks;
  login: typeof mockApi.login;
  register: typeof mockApi.register;
  isMockMode: boolean;
}

const ApiContext = createContext<ApiService | null>(null);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const api: ApiService = {
    ...mockApi,
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