import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import * as apiService from '../services/api';

export interface ApiService {
  // Auth
  login: typeof apiService.login;
  register: typeof apiService.register;
  
  // Users
  getUsers: typeof apiService.getUsers;
  getCurrentUser: typeof apiService.getCurrentUser;
  updateProfile: typeof apiService.updateProfile;
  updateUser: typeof apiService.updateUser;
  deleteUser: typeof apiService.deleteUser;
  bindNotification: typeof apiService.bindNotification;
  
  // Projects
  getProjects: typeof apiService.getProjects;
  createProject: typeof apiService.createProject;
  
  // Project Pages
  getProjectPages: typeof apiService.getProjectPages;
  createProjectPage: typeof apiService.createProjectPage;
  
  // Tasks
  getTasksByPage: typeof apiService.getTasksByPage;
  getTasksByProject: typeof apiService.getTasksByProject;
  createTask: typeof apiService.createTask;
  moveTask: typeof apiService.moveTask;
  updateTask: typeof apiService.updateTask;
  deleteTask: typeof apiService.deleteTask;
  getTaskHistory: typeof apiService.getTaskHistory;
  createComment: typeof apiService.createComment;
  getComments: typeof apiService.getComments;

  // Members & roles
  getRoles: typeof apiService.getRoles;
  getProjectMembers: typeof apiService.getProjectMembers;
  addProjectMember: typeof apiService.addProjectMember;
  updateProjectMember: typeof apiService.updateProjectMember;
  removeProjectMember: typeof apiService.removeProjectMember;

  // Admin
  blockUser: typeof apiService.blockUser;
  unblockUser: typeof apiService.unblockUser;

  // Telegram
  getTelegramLinkCode: typeof apiService.getTelegramLinkCode;

  // AI
  aiChat: typeof apiService.aiChat;
}

const ApiContext = createContext<ApiService | null>(null);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const api: ApiService = {
    ...apiService,
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