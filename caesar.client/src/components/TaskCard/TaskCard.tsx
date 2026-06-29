import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';
import { STATUS_LABELS } from '../../types';
import { getDeadlineStatus, formatDate } from '../../utils/dateHelpers';
import { Icon } from '../Icon/Icon';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const deadlineStatus = getDeadlineStatus(task.deadline);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      task,
      status: task.status,
    },
  });

  // Скрываем исходную карточку, пока она «летит» в DragOverlay — это убирает
  // двоение и рывки. Реальный визуал во время перетаскивания рисует overlay.
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  const getStatusClassName = () => {
    switch (deadlineStatus) {
      case 'expired': return 'task-card--expired';
      case 'soon': return 'task-card--soon';
      default: return '';
    }
  };

  // Порог активации в сенсоре сам отличает клик от драга:
  // обычный клик (без смещения) не запускает перетаскивание и спокойно открывает задачу.
  const handleClick = () => {
    if (isDragging) return;
    onClick(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`task-card ${getStatusClassName()}`}
      onClick={handleClick}
    >
      <div className="task-card__header">
        <span className="task-card__id">#{task.id}</span>
        <span className="task-card__status-badge">
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <h4 className="task-card__title">{task.title}</h4>

      <div className="task-card__footer">
        {task.deadline && (
          <span className="task-card__deadline">
            <Icon name="calendar" size={14} /> {formatDate(task.deadline)}
          </span>
        )}
        {task.assignee_name && (
          <span className="task-card__assignee">
            <Icon name="user" size={14} /> {task.assignee_name}
          </span>
        )}
      </div>
    </div>
  );
};
