import { useState, useEffect, useCallback } from 'react';
import type { Task, TaskStatus } from '../types';
import { getTasks as getTasksApi } from '../services/mockApi';

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
 * Приводит «сырую» задачу из бэкенда (camelCase, status — число) к фронтовому типу Task (snake_case).
 * Если объект уже во фронтовом формате (mock), возвращаем как есть.
 */
export const normalizeTask = (raw: any): Task => {
  if (!raw) return raw;

  // Уже нормализованная mock-задача (status — строка, есть page_id)
  if (typeof raw.status === 'string' && 'page_id' in raw) {
    return raw as Task;
  }

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
    try {
      setLoading(true);
      const data = await getTasksApi(pageId);
      setTasks((data || []).map(normalizeTask));
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
        const token = localStorage.getItem('caesar_token');

        // Бэкенд ожидает CreateTaskDto: { projectPageId, title, description, deadline }
        const payload = {
          projectPageId: taskData.page_id ?? pageId ?? 1,
          title: taskData.title,
          description: taskData.description ?? '',
          deadline: taskData.deadline ? taskData.deadline : null,
        };

        const response = await fetch('/api/Tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Ошибка создания задачи');
        }

        const newTask = normalizeTask(await response.json());
        setTasks(prev => [...prev, newTask]);
        return newTask;
      } catch (err) {
        console.error('Ошибка создания задачи:', err);
        throw err;
      }
    },
    [pageId]
  );

  const moveTask = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      try {
        const token = localStorage.getItem('caesar_token');

        // Позиция в конце целевой колонки
        const newPosition = tasks.filter(t => t.status === newStatus).length;

        // Бэкенд ожидает MoveTaskDto: { targetTaskStatus (enum int 1..4), newPosition }
        const payload = {
          targetTaskStatus: STATUS_TO_INT[newStatus],
          newPosition,
        };

        const response = await fetch(`/api/Tasks/${taskId}/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || 'Ошибка перемещения задачи');
        }

        const updated = normalizeTask(await response.json());
        setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
        return updated;
      } catch (err) {
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
