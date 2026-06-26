import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus } from '../types';
import { getTasks as getTasksApi } from '../services/mockApi';

export const useTasks = (pageId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTasksApi(pageId);
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки задач');
      console.error('❌ Ошибка загрузки задач:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [tasks]);

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const token = localStorage.getItem('caesar_token');
      const response = await fetch('/api/Tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Ошибка создания задачи');
      }

      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Ошибка создания задачи:', err);
      throw err;
    }
  }, []);

  const moveTask = useCallback(async (taskId: number, newStatus: TaskStatus) => {
    try {
      const token = localStorage.getItem('caesar_token');
      const response = await fetch(`/api/Tasks/${taskId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Ошибка перемещения задачи');
      }

      const updated = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      return updated;
    } catch (err) {
      console.error('Ошибка перемещения задачи:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    getTasksByStatus,
    createTask,
    moveTask,
  };
};