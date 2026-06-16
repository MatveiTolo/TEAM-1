import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';
import { STATUS_LABELS } from '../../types';
import { getDeadlineStatus, formatDate } from '../../utils/dateHelpers';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const deadlineStatus = getDeadlineStatus(task.deadline);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task,
      status: task.status,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  const getStatusClassName = () => {
    switch (deadlineStatus) {
      case 'expired': return 'task-card--expired';
      case 'soon': return 'task-card--soon';
      default: return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`task-card ${getStatusClassName()}`}
      onClick={() => onClick(task)}
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
            📅 {formatDate(task.deadline)}
          </span>
        )}
        {task.assignee_name && (
          <span className="task-card__assignee">
            👤 {task.assignee_name}
          </span>
        )}
      </div>
    </div>
  );
};