import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus } from '../types';
import { api } from '../services/api';

// ---- Сопоставление статусов фронта (строки) и бэка (enum BoardTaskStatus 1..4) ----
const STATUS_TO_INT: Record<TaskStatus, number> = {
  preparation: 1,
  execution: 2,
  testing: 3,
  done: 4,
};

const INT_TO_STATUS: Record<number, TaskStatus> = {
  1: 'preparation',
  2: 'execution',
  3: 'testing',
  4: 'done',
};

/**
 * Приводит «сырую» задачу из бэкенда (camelCase, status — число) к фронтовому типу Task (snake_case)
 */
export const normalizeTask = (raw: any): Task => {
  if (!raw) return raw;

  const statusValue: TaskStatus =
    typeof raw.status === 'number'
      ? INT_TO_STATUS[raw.status] ?? 'preparation'
      : (raw.status as TaskStatus) ?? 'preparation';

  return {
    id: raw.id,
    title: raw.title ?? '',
    description: raw.description ?? '',
    status: statusValue,
    deadline: raw.deadline ?? null,
    created_by: raw.createdById ?? raw.created_by ?? 0,
    assignee_id: raw.assignedToId ?? raw.assignee_id ?? null,
    assignee_name: raw.assignedToName ?? raw.assignee_name ?? null,
    page_id: raw.projectPageId ?? raw.page_id ?? 0,
    position: raw.position ?? 0,
    created_at: raw.createdAt ?? raw.created_at ?? '',
    updated_at: raw.updatedAt ?? raw.updated_at ?? '',
  };
};

export const useTasks = (pageId?: number) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    if (!pageId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.getTasksByPage(pageId);
      setTasks((response.data || []).map(normalizeTask));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки задач');
      console.error('Ошибка загрузки задач:', err);
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks
        .filter(task => task.status === status)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    },
    [tasks]
  );

  const createTask = useCallback(
    async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        // ФОРМАТИРОВАНИЕ ДАТЫ В UTC (для PostgreSQL timestamp with time zone)
        let deadlineValue = null;
        if (taskData.deadline) {
          // Парсим дату как UTC
          const date = new Date(taskData.deadline);
          if (!isNaN(date.getTime())) {
            // Преобразуем в UTC строку (формат ISO с Z на конце)
            deadlineValue = date.toISOString();
          } else {
            deadlineValue = taskData.deadline;
          }
        }

        const payload = {
          projectPageId: taskData.page_id ?? pageId ?? 1,
          title: taskData.title,
          description: taskData.description ?? '',
          deadline: deadlineValue, // Отправляем в UTC формате (например, "2026-06-27T00:00:00.000Z")
        };

        console.log('Отправка запроса на создание задачи:', JSON.stringify(payload, null, 2));

        const response = await api.createTask(payload);
        console.log('Ответ от сервера:', response.data);

        const newTask = normalizeTask(response.data);
        setTasks(prev => [...prev, newTask]);
        return newTask;
      } catch (err: any) {
        console.error('Ошибка создания задачи:', err);
        
        if (err.response) {
          console.error('Детали ошибки:', {
            status: err.response.status,
            data: err.response.data,
          });
          
          const serverMessage = err.response.data?.message || err.response.data?.title || err.response.data;
          throw new Error(`Ошибка сервера (${err.response.status}): ${serverMessage || 'Неизвестная ошибка'}`);
        } else if (err.request) {
          throw new Error('Сервер не отвечает. Проверьте подключение.');
        } else {
          throw new Error(err.message || 'Ошибка при создании задачи');
        }
      }
    },
    [pageId]
  );

  const moveTask = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      try {
        const newPosition = tasks.filter(t => t.status === newStatus).length;

        const payload = {
          targetTaskStatus: STATUS_TO_INT[newStatus],
          newPosition,
        };

        console.log('Перемещение задачи:', { taskId, payload });

        const response = await api.moveTask(taskId, payload);
        const updated = normalizeTask(response.data);
        setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
        return updated;
      } catch (err: any) {
        console.error('Ошибка перемещения задачи:', err);
        throw err;
      }
    },
    [tasks]
  );

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