// src/api/apiClient.ts
import type { Task } from '../types';

export const apiClient = {
  // Теперь запрос всегда идёт на бэкенд. Если бэк упадёт — будет ошибка в консоли.
  getTasks: async (projectId?: number): Promise<Task[]> => {
    const url = projectId ? `/api/tasks?projectId=${projectId}` : `/api/tasks`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Бэкенд не вернул задачи');
    return response.json();
  },

  createTask: async (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    const response = await fetch(`/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Не удалось создать задачу');
    return response.json();
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Не удалось обновить задачу');
    return response.json();
  },

  deleteTask: async (id: number): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Не удалось удалить задачу');
  },

  getTaskHistory: async (id: number) => {
    const response = await fetch(`/api/tasks/${id}/history`);
    if (!response.ok) throw new Error('Не удалось загрузить историю');
    return response.json();
  }
};