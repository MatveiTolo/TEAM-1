import type { Task } from '../types';

export const mockTasks: Task[] = [
  {
    id: 1,
    title: 'Настроить прокси фронтенда',
    description: 'Настроить Vite для проксирования запросов к бэкенду',
    status: 'execution',
    deadline: new Date(Date.now() + 86400000).toISOString(),
    created_by: 1,
    assignee_id: 2,
    assignee_name: 'Иван Петров',
    page_id: 1,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    title: 'Создать компонент колонки',
    description: 'Реализовать Column компонент для доски',
    status: 'preparation',
    deadline: new Date(Date.now() - 86400000).toISOString(),
    created_by: 1,
    assignee_id: null,
    assignee_name: undefined,
    page_id: 1,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    title: 'Написать тесты для API',
    description: 'Покрыть тестами основные эндпоинты',
    status: 'testing',
    deadline: new Date(Date.now() + 172800000).toISOString(),
    created_by: 1,
    assignee_id: 3,
    assignee_name: 'Мария Смирнова',
    page_id: 1,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    title: 'Добавить Telegram уведомления',
    description: 'Интеграция с Telegram ботом',
    status: 'done',
    deadline: null,
    created_by: 1,
    assignee_id: 2,
    assignee_name: 'Иван Петров',
    page_id: 1,
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];