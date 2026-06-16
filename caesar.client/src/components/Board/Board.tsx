import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useTasks } from '../../hooks/useTasks';
import type { Task, TaskStatus } from '../../types';
import { STATUS_ORDER } from '../../types';
import { Column } from '../Column/Column';
import { TaskCard } from '../TaskCard/TaskCard';
import './Board.css';

const COLUMNS: TaskStatus[] = ['preparation', 'execution', 'testing', 'done'];

export const Board = () => {
  const { tasks, loading, error, getTasksByStatus, moveTask } = useTasks();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleTaskClick = (task: Task) => {
    alert(`Задача #${task.id}: ${task.title}`);
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
    
    // Находим задачу
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Проверяем, изменился ли статус
    if (task.status === newStatus) return;

    // Проверяем правило соседства (можно перемещать только на 1 шаг)
    const oldIndex = STATUS_ORDER[task.status];
    const newIndex = STATUS_ORDER[newStatus];
    const diff = Math.abs(oldIndex - newIndex);
    
    if (diff !== 1) {
      alert('❌ Нельзя перепрыгивать через колонку! Перемещайте только на соседнюю.');
      return;
    }

    // Перемещаем задачу
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
        <p>❌ {error}</p>
        <button onClick={() => window.location.reload()}>Обновить</button>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        <div className="board__header">
          <h1 className="board__title">📋 Доска задач</h1>
          <button className="board__add-btn">
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

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} onClick={handleTaskClick} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};