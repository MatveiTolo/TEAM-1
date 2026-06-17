import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task } from '../../types';
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
}

export const CreateTaskModal = ({ isOpen, onClose, onCreate }: CreateTaskModalProps) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'preparation',
      page_id: 1,
      created_by: 1,
      assignee_id: null,
      deadline: null,
    }
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      await onCreate(data as Omit<Task, 'id' | 'created_at' | 'updated_at'>);
      reset();
      onClose();
    } catch (error) {
      console.error('Ошибка создания задачи:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Создать задачу</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="modal__form">
          <div className="form-group">
            <label htmlFor="title">Название *</label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <span className="error-message">{errors.title.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
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
              <option value="1">Иван Петров</option>
              <option value="2">Мария Смирнова</option>
              <option value="3">Алексей Иванов</option>
            </select>
          </div>

          <div className="modal__actions">
            <button type="button" onClick={onClose} className="btn-secondary">
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