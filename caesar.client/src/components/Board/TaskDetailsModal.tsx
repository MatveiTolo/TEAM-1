import { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import type { Task } from '../../types';
import { formatDate, getDeadlineStatus } from '../../utils/dateHelpers';
import './TaskDetailsModal.css';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
}

interface HistoryItem {
  user_name: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

interface Comment {
  id: number;
  user_name: string;
  text: string;
  created_at: string;
}

export const TaskDetailsModal = ({ 
  task, 
  isOpen, 
  onClose, 
  onTaskUpdated,
  onTaskDeleted 
}: TaskDetailsModalProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    deadline: '',
    assigneeId: null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (task && isOpen) {
      loadHistory(task.id);
      loadComments(task.id);
      setEditData({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline || '',
        assigneeId: task.assignee_id || null,
      });
      setIsEditing(false);
    }
  }, [task, isOpen]);

  const loadHistory = async (taskId: number) => {
    try {
      setLoading(true);
      const response = await api.getTaskHistory(taskId);
      // Извлекаем данные из ответа
      const data = response.data;
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (taskId: number) => {
    try {
      const response = await api.getComments(taskId);
      // Извлекаем данные из ответа
      const data = response.data;
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
      setComments([]);
    }
  };

  const handleSave = async () => {
    if (!task) return;

    try {
      setSaving(true);
      const response = await api.updateTask(task.id, {
        title: editData.title,
        description: editData.description,
        deadline: editData.deadline || null,
        assignedToId: editData.assigneeId,
      });
      
      // Извлекаем данные из ответа
      const updated = response.data;
      
      setIsEditing(false);
      if (onTaskUpdated) {
        onTaskUpdated(updated);
      }
      // Обновляем локальные данные
      task.title = editData.title;
      task.description = editData.description;
      task.deadline = editData.deadline || null;
      task.assignee_id = editData.assigneeId;
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (!confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?`)) return;

    try {
      await api.deleteTask(task.id);
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }
      onClose();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить задачу');
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
          {!isEditing ? (
            <>
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

              <div className="task-detail__comments">
                <h4>Комментарии</h4>
                {comments.length === 0 ? (
                  <p className="task-detail__empty">Нет комментариев</p>
                ) : (
                  <ul className="task-detail__comments-list">
                    {comments.map((comment) => (
                      <li key={comment.id} className="task-detail__comment-item">
                        <div className="task-detail__comment-header">
                          <span className="task-detail__comment-user">{comment.user_name}</span>
                          <span className="task-detail__comment-date">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <div className="task-detail__comment-text">{comment.text}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="modal__actions task-detail__actions">
                <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                  ✏️ Редактировать
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  🗑️ Удалить
                </button>
                <button className="btn-primary" onClick={onClose}>
                  Закрыть
                </button>
              </div>
            </>
          ) : (
            <div className="task-detail__edit">
              <h3 className="task-detail__edit-title">Редактирование задачи</h3>
              
              <div className="task-detail__edit-field">
                <label>Название</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>

              <div className="task-detail__edit-field">
                <label>Описание</label>
                <textarea
                  rows={3}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>

              <div className="task-detail__edit-field">
                <label>Дедлайн</label>
                <input
                  type="date"
                  value={editData.deadline}
                  onChange={(e) => setEditData({ ...editData, deadline: e.target.value })}
                />
              </div>

              <div className="task-detail__edit-field">
                <label>Исполнитель (ID)</label>
                <input
                  type="number"
                  value={editData.assigneeId || ''}
                  onChange={(e) => setEditData({ 
                    ...editData, 
                    assigneeId: e.target.value ? Number(e.target.value) : null 
                  })}
                  placeholder="ID пользователя"
                />
              </div>

              <div className="modal__actions task-detail__actions">
                <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  Отмена
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Сохранение...' : '💾 Сохранить'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};