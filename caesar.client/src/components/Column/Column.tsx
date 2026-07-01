import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, TaskStatus } from '../../types';
import { STATUS_LABELS } from '../../types';
import { TaskCard } from '../TaskCard/TaskCard';
import './Column.css';

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

// Обёртка карточки в сортируемый элемент (реордер внутри колонки — Задача 2).
const SortableTaskCard = ({ task, onClick }: { task: Task; onClick: (t: Task) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task, status: task.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
};

export const Column = ({ status, tasks, onTaskClick }: ColumnProps) => {
  // Колонка — droppable-контейнер (нужно для дропа в пустую колонку).
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${status}`,
    data: { status, isColumn: true },
  });

  const label = STATUS_LABELS[status];
  const ids = tasks.map(t => t.id);

  return (
    <div ref={setNodeRef} className={`column ${isOver ? 'column--drag-over' : ''}`}>
      <div className="column__header">
        <h3 className="column__title">{label}</h3>
        <span className="column__count">{tasks.length}</span>
      </div>

      <div className="column__tasks">
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="column__empty">Нет задач</div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} onClick={onTaskClick} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};
