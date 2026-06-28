export type TaskStatus = 'preparation' | 'execution' | 'testing' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string | null;
  created_by: number;
  assignee_id: number | null;
  assignee_name?: string | null;
  page_id: number;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'page_admin' | 'developer' | 'tester' | 'viewer';
  page_id: number | null;
}

export const STATUS_ORDER: Record<TaskStatus, number> = {
  preparation: 0,
  execution: 1,
  testing: 2,
  done: 3
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  preparation: 'Преподготовка',
  execution: 'Выполнение',
  testing: 'Тестирование',
  done: 'Готово'
};