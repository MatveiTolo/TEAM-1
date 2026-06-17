import { useState, useEffect } from 'react';
import type { Task } from '../../types';
import { formatDate, getDeadlineStatus } from '../../utils/dateHelpers';
import { apiClient } from '../../api/apiClient';
import './TaskDetailsModal.css';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryItem {
  user_name: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export const TaskDetailsModal = ({ task, isOpen, onClose }: TaskDetailsModalProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      loadHistory(task.id);
    }
  }, [task, isOpen]);

  const loadHistory = async (taskId: number) => {
    try {
      setLoading(true);
      const data = await apiClient.getTaskHistory(taskId);
      setHistory(data);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  const deadlineStatus = getDeadlineStatus(task.deadline);
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      preparation: 'Преподготовка',
      execution: 'Выполнение',
      testing: 'Тестирование',
      done: 'Готово'
    };
    return labels[status] || status;
  };

  const getDeadlineClass = () => {
    switch (deadlineStatus) {
      case 'expired': return 'task-detail__deadline--expired';
      case 'soon': return 'task-detail__deadline--soon';
      default: return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal task-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Задача #{task.id}</h2>
          <button className="modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="task-detail__content">
          <h3 className="task-detail__title">{task.title}</h3>
          
          <div className="task-detail__meta">
            <div className="task-detail__field">
              <span className="task-detail__label">Статус:</span>
              <span className="task-detail__value task-detail__status">
                {getStatusLabel(task.status)}
              </span>
            </div>
            
            <div className="task-detail__field">
              <span className="task-detail__label">Дедлайн:</span>
              <span className={`task-detail__value ${getDeadlineClass()}`}>
                {task.deadline ? formatDate(task.deadline) : 'Не задан'}
              </span>
            </div>

            <div className="task-detail__field">
              <span className="task-detail__label">Исполнитель:</span>
              <span className="task-detail__value">
                {task.assignee_name || 'Не назначен'}
              </span>
            </div>

            <div className="task-detail__field">
              <span className="task-detail__label">Создана:</span>
              <span className="task-detail__value">
                {formatDate(task.created_at)}
              </span>
            </div>
          </div>

          {task.description && (
            <div className="task-detail__description">
              <h4>Описание</h4>
              <p>{task.description}</p>
            </div>
          )}

          <div className="task-detail__history">
            <h4>История изменений</h4>
            {loading ? (
              <p className="task-detail__loading">Загрузка истории...</p>
            ) : history.length === 0 ? (
              <p className="task-detail__empty">История пуста</p>
            ) : (
              <ul className="task-detail__history-list">
                {history.map((item, index) => (
                  <li key={index} className="task-detail__history-item">
                    <div className="task-detail__history-header">
                      <span className="task-detail__history-user">{item.user_name}</span>
                      <span className="task-detail__history-date">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <div className="task-detail__history-action">
                      {item.action}
                      {item.old_value && item.new_value && (
                        <span>
                          : {item.old_value} → {item.new_value}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="modal__actions task-detail__actions">
          <button className="btn-secondary" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};