import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DropAnimation } from '@dnd-kit/core';
import { useApi } from '../../context/ApiContext';
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

interface ProjectPage {
  id: number;
  name: string;
}

interface BoardProps {
  projectId?: number | null;
  initialPageId?: number | null;
  onActivePageChange?: (pageId: number) => void;
}

export const Board = ({ projectId, initialPageId, onActivePageChange }: BoardProps) => {
  const api = useApi();

  // ---- Страницы (доски) проекта — Задача 3 ----
  const [pages, setPages] = useState<ProjectPage[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(initialPageId ?? null);
  const [pagesLoading, setPagesLoading] = useState(false);

  const loadPages = useCallback(async () => {
    if (!projectId) return;
    setPagesLoading(true);
    try {
      const res = await api.getProjectPages(projectId);
      let list: ProjectPage[] = res.data || [];
      // У проекта нет ни одной доски — создаём базовую.
      if (list.length === 0) {
        const created = await api.createProjectPage({ name: 'Основная доска', projectId });
        list = [created.data];
      }
      setPages(list);
      setActivePageId(prev => {
        const next = prev && list.some(p => p.id === prev) ? prev : list[0].id;
        onActivePageChange?.(next);
        return next;
      });
    } catch (e) {
      console.error('Ошибка загрузки досок:', e);
    } finally {
      setPagesLoading(false);
    }
  }, [api, projectId, onActivePageChange]);

  useEffect(() => { loadPages(); }, [loadPages]);

  const handleCreatePage = async () => {
    if (!projectId) return;
    const name = window.prompt('Название новой доски:', `Доска ${pages.length + 1}`);
    if (!name || !name.trim()) return;
    try {
      const created = await api.createProjectPage({ name: name.trim(), projectId });
      setPages(prev => [...prev, created.data]);
      setActivePageId(created.data.id);
      onActivePageChange?.(created.data.id);
    } catch (e: any) {
      alert(e?.response?.data || 'Не удалось создать доску (нужны права администратора).');
    }
  };

  const switchPage = (id: number) => {
    setActivePageId(id);
    onActivePageChange?.(id);
  };

  // ---- Задачи активной доски ----
  const { tasks, loading, error, getTasksByStatus, moveTask, createTask, loadTasks } =
    useTasks(activePageId ?? undefined);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  const dropAnimation: DropAnimation = {
    duration: 220,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.35' } } }),
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as number;
    const task = tasks.find(t => t.id === id) || null;
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as number;
    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    // Определяем целевую колонку и позицию.
    const overId = over.id;
    let targetStatus: TaskStatus;
    let targetIndex: number;

    if (typeof overId === 'string' && overId.startsWith('col:')) {
      targetStatus = overId.slice(4) as TaskStatus;
      targetIndex = getTasksByStatus(targetStatus).filter(t => t.id !== activeId).length;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      const colTasks = getTasksByStatus(targetStatus).filter(t => t.id !== activeId);
      const idx = colTasks.findIndex(t => t.id === overId);
      targetIndex = idx < 0 ? colTasks.length : idx;
    }

    const sameColumn = task.status === targetStatus;

    if (!sameColumn) {
      const diff = Math.abs(STATUS_ORDER[task.status] - STATUS_ORDER[targetStatus]);
      if (diff !== 1) {
        alert('Нельзя перепрыгивать через колонку! Перемещайте только на соседнюю.');
        return;
      }
    } else {
      const curIndex = getTasksByStatus(targetStatus).findIndex(t => t.id === activeId);
      if (curIndex === targetIndex) return; // позиция не изменилась
    }

    moveTask(activeId, targetStatus, targetIndex).catch((e: any) => {
      alert(e?.response?.data || 'Перемещение отклонено (проверьте права роли).');
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        <div className="board__header">
          <h1 className="board__title"><Icon name="board" size={22} /> Доска задач</h1>
          <button className="board__add-btn" onClick={() => setIsModalOpen(true)} disabled={!activePageId}>
            + Создать задачу
          </button>
        </div>

        {/* Табы досок проекта (Задача 3) */}
        {projectId && (
          <div className="board__pages">
            {pages.map(p => (
              <button
                key={p.id}
                className={`board__page-tab${p.id === activePageId ? ' is-active' : ''}`}
                onClick={() => switchPage(p.id)}
              >
                {p.name}
              </button>
            ))}
            <button className="board__page-add" onClick={handleCreatePage} title="Добавить доску">
              + Доска
            </button>
          </div>
        )}

        {pagesLoading || loading ? (
          <div className="board__loading">
            <div className="board__spinner"></div>
            <p>Загрузка задач...</p>
          </div>
        ) : error ? (
          <div className="board__error">
            <p><Icon name="alert" size={16} /> {error}</p>
            <button onClick={() => loadTasks()}>Обновить</button>
          </div>
        ) : (
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
        )}
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
        pageId={activePageId ?? undefined}
      />

      <TaskDetailsModal
        task={selectedTask}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={() => loadTasks()}
        onTaskDeleted={() => loadTasks()}
      />
    </DndContext>
  );
};
