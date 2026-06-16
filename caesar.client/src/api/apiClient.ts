import type { Task } from '../types';
import { mockTasks } from './mockData';

const USE_MOCK = true;  // Временно используем заглушку

export const apiClient = {
  getTasks: async (): Promise<Task[]> => {
    if (USE_MOCK) {
      console.log('📦 Возвращаем мок-данные');
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockTasks;
    }
    
    const response = await fetch(`/api/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  createTask: async (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
    if (USE_MOCK) {
      const newTask: Task = {
        ...data,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockTasks.push(newTask);
      await new Promise(resolve => setTimeout(resolve, 300));
      return newTask;
    }
    
    const response = await fetch(`/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    if (USE_MOCK) {
      const task = mockTasks.find(t => t.id === id);
      if (!task) throw new Error('Task not found');
      Object.assign(task, data);
      await new Promise(resolve => setTimeout(resolve, 300));
      return task;
    }
    
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  deleteTask: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      const index = mockTasks.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Task not found');
      mockTasks.splice(index, 1);
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    }
    
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },

  getTaskHistory: async (id: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        { 
          user_name: 'Иван Петров', 
          action: 'Создал задачу', 
          created_at: new Date().toISOString() 
        },
        { 
          user_name: 'Мария Смирнова', 
          action: 'Изменил статус с "Преподготовка" на "Выполнение"', 
          created_at: new Date(Date.now() - 3600000).toISOString() 
        }
      ];
    }
    
    const response = await fetch(`/api/tasks/${id}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  }
};