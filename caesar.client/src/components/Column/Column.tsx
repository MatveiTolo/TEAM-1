import { useDroppable } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { TaskCard } from '../TaskCard/TaskCard';
import './Column.css';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const Column = ({ status, tasks, onTaskClick }: ColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      status,
    },
  });

  const label = STATUS_LABELS[status];

  return (
    <div 
      ref={setNodeRef}
      className={`column ${isOver ? 'column--drag-over' : ''}`}
    >
      <div className="column__header">
        <h3 className="column__title">{label}</h3>
        <span className="column__count">{tasks.length}</span>
      </div>
      
      <div className="column__tasks">
        {tasks.length === 0 ? (
          <div className="column__empty">Нет задач</div>
        ) : (
          tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
};