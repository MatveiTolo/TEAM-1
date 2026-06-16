import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus } from '../types';
import { apiClient } from '../api/apiClient';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки задач');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => a.position - b.position);
  }, [tasks]);

  const createTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTask = await apiClient.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      console.error('Failed to create task:', err);
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: number, data: Partial<Task>) => {
    try {
      const updated = await apiClient.updateTask(id, data);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      console.error('Failed to update task:', err);
      throw err;
    }
  }, []);

  const moveTask = useCallback(async (
    taskId: number,
    newStatus: TaskStatus,
    newPosition?: number
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    const oldStatus = task.status;
    const oldPosition = task.position;
    
    // Оптимистичное обновление
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: newStatus, position: newPosition ?? t.position };
      }
      if (t.status === newStatus && newPosition !== undefined && t.position >= newPosition && t.id !== taskId) {
        return { ...t, position: t.position + 1 };
      }
      if (t.status === oldStatus && t.position > oldPosition && t.id !== taskId) {
        return { ...t, position: t.position - 1 };
      }
      return t;
    }));

    try {
      const updated = await apiClient.updateTask(taskId, {
        status: newStatus,
        position: newPosition ?? 0
      });
      
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
      return updated;
    } catch (err) {
      // Откат при ошибке
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { ...t, status: oldStatus, position: oldPosition };
        }
        return t;
      }));
      throw err;
    }
  }, [tasks]);

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
    updateTask,
    moveTask
  };
};