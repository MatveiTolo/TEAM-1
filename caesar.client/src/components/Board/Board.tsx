import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core';
import { useTasks } from '../../hooks/useTasks';
import type { Task, TaskStatus } from '../../types';
import { STATUS_ORDER } from '../../types';
import { Column } from '../Column/Column';
import { TaskCard } from '../TaskCard/TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailsModal } from './TaskDetailsModal';
import { Icon } from '../Icon/Icon';
import './Board.css';

const COLUMNS: TaskStatus[] = ['preparation', 'execution', 'testing', 'done'];

interface BoardProps {
  pageId?: number;
}

export const Board = ({ pageId = 1 }: BoardProps) => {
  const { tasks, loading, error, getTasksByStatus, moveTask, createTask, loadTasks } = useTasks(pageId);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Сенсоры с порогом активации: короткий клик открывает задачу,
  // а перетаскивание начинается только после небольшого смещения —
  // это убирает «залипание» и конфликт клика с драгом.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
  );

  // Плавная анимация «приземления» карточки в новую колонку.
  const dropAnimation: DropAnimation = {
    duration: 220,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.35' },
      },
    }),
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleTaskUpdated = (_updatedTask: Task) => {
    loadTasks();
  };

  const handleTaskDeleted = (_taskId: number) => {
    loadTasks();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { task } = event.active.data.current || {};
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as TaskStatus;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === newStatus) return;

    const oldIndex = STATUS_ORDER[task.status];
    const newIndex = STATUS_ORDER[newStatus];
    const diff = Math.abs(oldIndex - newIndex);
    
    if (diff !== 1) {
      alert('Нельзя перепрыгивать через колонку! Перемещайте только на соседнюю.');
      return;
    }

    moveTask(taskId, newStatus);
  };

  if (loading) {
    return (
      <div className="board__loading">
        <div className="board__spinner"></div>
        <p>Загрузка задач...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="board__error">
        <p><Icon name="alert" size={16} /> {error}</p>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        <div className="board__header">
          <h1 className="board__title"><Icon name="board" size={22} /> Доска задач</h1>
          <button className="board__add-btn" onClick={() => setIsModalOpen(true)}>
            + Создать задачу
          </button>
        </div>
        
        <div className="board__columns">
          {COLUMNS.map(status => (
            <Column
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? (
          <div className="task-card--overlay">
            <TaskCard task={activeTask} onClick={handleTaskClick} />
          </div>
        ) : null}
      </DragOverlay>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={createTask}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
      />
    </DndContext>
  );
};