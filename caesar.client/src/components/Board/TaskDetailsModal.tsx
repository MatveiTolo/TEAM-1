import { useState, useEffect } from 'react';
import { useApi } from '../../context/ApiContext';
import type { Task } from '../../types';
import { formatDate, getDeadlineStatus } from '../../utils/dateHelpers';
import { Icon } from '../Icon/Icon';
import './TaskDetailsModal.css';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
}

// Форма истории после нормализации ответа бэкенда (TaskHistoryDto, camelCase).
interface HistoryItem {
  id: number;
  username: string;
  actionType: string;
  statusBeforeName: string;
  statusAfterName: string;
  details: string;
  createdAt: string;
}

// Форма комментария (CommentDto, camelCase).
interface CommentItem {
  id: number;
  username: string;
  text: string;
  createdAt: string;
}

// Бэкенд по умолчанию сериализует в camelCase. Раньше компонент читал snake_case
// (user_name/action/created_at) — из-за этого история и комментарии были «пустыми».
const normalizeHistory = (raw: any): HistoryItem => ({
  id: raw.id ?? 0,
  username: raw.username ?? raw.user_name ?? 'Система',
  actionType: raw.actionType ?? raw.action ?? '',
  statusBeforeName: raw.statusBeforeName ?? raw.status_before_name ?? '',
  statusAfterName: raw.statusAfterName ?? raw.status_after_name ?? '',
  details: raw.details ?? '',
  createdAt: raw.createdAt ?? raw.created_at ?? '',
});

const normalizeComment = (raw: any): CommentItem => ({
  id: raw.id ?? 0,
  username: raw.username ?? raw.user_name ?? 'Пользователь',
  text: raw.text ?? '',
  createdAt: raw.createdAt ?? raw.created_at ?? '',
});

// «2026-07-15» из <input type="date"> → UTC ISO, чтобы PostgreSQL timestamptz не падал.
const toUtcIso = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : d.toISOString();
};

export const TaskDetailsModal = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: TaskDetailsModalProps) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    deadline: '',
    assigneeId: null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (task && isOpen) {
      loadHistory(task.id);
      loadComments(task.id);
      setEditData({
        title: task.title,
        description: task.description || '',
        deadline: task.deadline ? task.deadline.slice(0, 10) : '',
        assigneeId: task.assignee_id || null,
      });
      setIsEditing(false);
      setCommentText('');
    }
  }, [task, isOpen]);

  const loadHistory = async (taskId: number) => {
    try {
      setLoading(true);
      const response = await api.getTaskHistory(taskId);
      const data = response.data;
      setHistory(Array.isArray(data) ? data.map(normalizeHistory) : []);
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
      const data = response.data;
      setComments(Array.isArray(data) ? data.map(normalizeComment) : []);
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
        deadline: toUtcIso(editData.deadline),
        assignedToId: editData.assigneeId,
      });
      const updated = response.data;
      setIsEditing(false);
      if (onTaskUpdated) onTaskUpdated(updated);
      task.title = editData.title;
      task.description = editData.description;
      task.deadline = toUtcIso(editData.deadline);
      task.assignee_id = editData.assigneeId;
      // История пополнилась записью «Изменена» — перечитываем.
      loadHistory(task.id);
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!task) return;
    const text = commentText.trim();
    if (!text) return;
    try {
      setSendingComment(true);
      await api.createComment(task.id, { text });
      setCommentText('');
      // Комментарий пишет и запись в историю («Комментарий») — обновляем оба списка.
      await Promise.all([loadComments(task.id), loadHistory(task.id)]);
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      alert('Не удалось отправить комментарий');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm(`Вы уверены, что хотите удалить задачу "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      if (onTaskDeleted) onTaskDeleted(task.id);
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
      done: 'Готово',
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
          <button className="modal__close" onClick={onClose}><Icon name="close" size={18} /></button>
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
                    {history.map((item) => (
                      <li key={item.id} className="task-detail__history-item">
                        <div className="task-detail__history-header">
                          <span className="task-detail__history-user">{item.username}</span>
                          <span className="task-detail__history-date">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <div className="task-detail__history-action">
                          <strong>{item.actionType}</strong>
                          {item.details ? ` — ${item.details}` : ''}
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
                          <span className="task-detail__comment-user">{comment.username}</span>
                          <span className="task-detail__comment-date">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div className="task-detail__comment-text">{comment.text}</div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="task-detail__comment-form">
                  <textarea
                    className="task-detail__comment-input"
                    rows={2}
                    placeholder="Написать комментарий…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment();
                    }}
                  />
                  <button
                    className="btn-primary task-detail__comment-send"
                    onClick={handleAddComment}
                    disabled={sendingComment || !commentText.trim()}
                  >
                    {sendingComment ? 'Отправка…' : <><Icon name="send" size={16} /> Отправить</>}
                  </button>
                </div>
              </div>

              <div className="modal__actions task-detail__actions">
                <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                  <Icon name="edit" size={16} /> Редактировать
                </button>
                <button className="btn-danger" onClick={handleDelete}>
                  <Icon name="trash" size={16} /> Удалить
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
                    assigneeId: e.target.value ? Number(e.target.value) : null,
                  })}
                  placeholder="ID пользователя"
                />
              </div>

              <div className="modal__actions task-detail__actions">
                <button className="btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                  Отмена
                </button>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Сохранение...' : <><Icon name="save" size={16} /> Сохранить</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
