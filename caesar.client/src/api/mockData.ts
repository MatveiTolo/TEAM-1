// src/api/mockData.ts
// ОСТАВЛЕНО КАК РЕЗЕРВ. НЕ ИСПОЛЬЗУЕТСЯ В ПРОДАКШЕНЕ.

import type { Task } from '../types';

export const mockTasks: Task[] = [
  { id: 1, title: 'Создать компонент колонки', status: 'preparation', deadline: '2026-06-15', assignee_name: null, description: 'Тест', created_by: 1, assignee_id: null, page_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), position: 0 },
  { id: 2, title: 'Настроить прокси фронтенда', status: 'execution', deadline: '2026-06-17', assignee_name: 'Иван Петров', description: 'Тест', created_by: 1, assignee_id: 2, page_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), position: 1 }
];