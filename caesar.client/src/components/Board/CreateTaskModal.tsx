import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task, User } from '../../types';
import { api } from '../../services/api';
import { Icon } from '../Icon/Icon';
import './CreateTaskModal.css';

// Схема валидации
const taskSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  deadline: z.string().nullable().optional(),
  assignee_id: z.number().nullable().optional(),
  status: z.enum(['preparation', 'execution', 'testing', 'done']),
  page_id: z.number(),
  created_by: z.number(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task>;
  pageId?: number;
  userId?: number;
}

export const CreateTaskModal = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  pageId = 1,
  userId = 1 
}: CreateTaskModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'preparation',
      page_id: pageId,
      created_by: userId,
      assignee_id: null,
      deadline: null,
    }
  });

  // Загрузка пользователей с сервера
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSubmitError(null);
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    setSubmitError(null);
    
    try {
      console.log('Отправка данных задачи:', data);
      
      const taskData = {
        ...data,
        page_id: pageId,
        created_by: userId,
      };
      
      const result = await onCreate(taskData as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
      console.log('Задача создана:', result);
      
      reset();
      onClose();
    } catch (error: any) {
      console.error('Ошибка создания задачи:', error);
      setSubmitError(error.message || 'Не удалось создать задачу. Попробуйте снова.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Создать задачу</h2>
          <button className="modal__close" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal__form">
          {submitError && (
            <div className="form-error" style={{ color: 'red', marginBottom: '16px', padding: '8px', background: '#ffeeee', borderRadius: '4px' }}>
              <Icon name="alert" size={16} /> {submitError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Название *</label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={errors.title ? 'error' : ''}
              placeholder="Введите название задачи"
            />
            {errors.title && <span className="error-message">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              placeholder="Введите описание задачи"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deadline">Дедлайн</label>
              <input
                id="deadline"
                type="date"
                {...register('deadline')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Статус</label>
              <select id="status" {...register('status')}>
                <option value="preparation">Преподготовка</option>
                <option value="execution">Выполнение</option>
                <option value="testing">Тестирование</option>
                <option value="done">Готово</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="assignee_id">Исполнитель</label>
            <select id="assignee_id" {...register('assignee_id', { valueAsNumber: true })}>
              <option value="">Не назначен</option>
              {loadingUsers ? (
                <option disabled>Загрузка...</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username || user.email}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};