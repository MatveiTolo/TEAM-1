import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Task } from '../../types';
import { STATUS_LABELS } from '../../types';
import { getDeadlineStatus, formatDate } from '../../utils/dateHelpers';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const deadlineStatus = getDeadlineStatus(task.deadline);
  
  const { attributes, listeners, setNodeRef, transform, isDragging: isDndDragging } = useDraggable({
    id: task.id,
    data: {
      task,
      status: task.status,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDndDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const getStatusClassName = () => {
    switch (deadlineStatus) {
      case 'expired': return 'task-card--expired';
      case 'soon': return 'task-card--soon';
      default: return '';
    }
  };

  const handleMouseDown = () => {
    setIsDragging(false);
  };

  const handleMouseMove = () => {
    setIsDragging(true);
  };

  const handleClick = () => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    onClick(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`task-card ${getStatusClassName()}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
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