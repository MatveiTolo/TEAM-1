import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../context/ApiContext';
import { STATUS_LABELS, STATUS_ORDER } from '../../types';
import type { Task, TaskStatus } from '../../types';
import { getDeadlineStatus, formatDate } from '../../utils/dateHelpers';
import './Reports.css';

// Маппинг статусов из чисел в строки (если бэкенд возвращает числа)
const INT_TO_STATUS: Record<number, string> = {
  1: 'preparation',
  2: 'execution',
  3: 'testing',
  4: 'done',
};

// Нормализация задачи для отчетов
const normalizeTaskForReports = (raw: any): Task => {
  const statusValue = typeof raw.status === 'number' 
    ? INT_TO_STATUS[raw.status] || 'preparation'
    : raw.status || 'preparation';
  
  return {
    id: raw.id,
    title: raw.title || '',
    description: raw.description || '',
    status: statusValue as TaskStatus,
    deadline: raw.deadline || null,
    created_by: raw.createdById || raw.created_by || 0,
    assignee_id: raw.assignedToId || raw.assignee_id || null,
    assignee_name: raw.assignedToName || raw.assignee_name || null,
    page_id: raw.projectPageId || raw.page_id || 0,
    position: raw.position || 0,
    created_at: raw.createdAt || raw.created_at || '',
    updated_at: raw.updatedAt || raw.updated_at || '',
  };
};

interface ReportsProps {
  pageId?: number;
}

export const Reports = ({ pageId = 1 }: ReportsProps) => {
  const api = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    
    api.getTasksByPage(pageId)
      .then((response: any) => { 
        if (active) {
          const normalizedTasks = (response.data || []).map(normalizeTaskForReports);
          setTasks(normalizedTasks);
          setError('');
        }
      })
      .catch((e: any) => { 
        if (active) {
          setError(e.message || 'Не удалось загрузить задачи');
          setTasks([]);
        }
      })
      .finally(() => { 
        if (active) setLoading(false); 
      });
      
    return () => { active = false; };
  }, [api, pageId]);

  const stats = useMemo(() => {
    const byStatus: Record<TaskStatus, number> = { 
      preparation: 0, 
      execution: 0, 
      testing: 0, 
      done: 0 
    };
    let overdue = 0, soon = 0;
    
    for (const t of tasks) {
      const status = t.status as TaskStatus;
      if (status in byStatus) {
        byStatus[status]++;
      }
      
      const ds = getDeadlineStatus(t.deadline);
      if (ds === 'expired') overdue++;
      if (ds === 'soon') soon++;
    }
    
    const total = tasks.length;
    const donePct = total ? Math.round((byStatus.done / total) * 100) : 0;
    return { byStatus, overdue, soon, total, donePct };
  }, [tasks]);

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.deadline && t.status !== 'done')
      .sort((a, b) => {
        const dateA = new Date(a.deadline!).getTime();
        const dateB = new Date(b.deadline!).getTime();
        return dateA - dateB;
      })
      .slice(0, 6);
  }, [tasks]);

  return (
    <div className="reports-container">
      <div className="rep-head">
        <h1 className="rep-title">Отчёты</h1>
        <p className="rep-sub">Сводка по текущему проекту</p>
      </div>

      {error && <div className="rep-error">{error}</div>}
      {loading && <div className="rep-loading">Загрузка…</div>}

      {!loading && !error && (
        <>
          <div className="rep-cards">
            <div className="rep-card">
              <span className="rep-card__num">{stats.total}</span>
              <span className="rep-card__label">Всего задач</span>
            </div>
            <div className="rep-card">
              <span className="rep-card__num">{stats.donePct}%</span>
              <span className="rep-card__label">Выполнено</span>
            </div>
            <div className="rep-card rep-card--warn">
              <span className="rep-card__num">{stats.soon}</span>
              <span className="rep-card__label">Дедлайн сегодня</span>
            </div>
            <div className="rep-card rep-card--danger">
              <span className="rep-card__num">{stats.overdue}</span>
              <span className="rep-card__label">Просрочено</span>
            </div>
          </div>

          <div className="rep-panel">
            <h2 className="rep-panel__title">Распределение по статусам</h2>
            <div className="rep-bars">
              {(Object.keys(STATUS_LABELS) as TaskStatus[])
                .sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b])
                .map((s) => {
                  const count = stats.byStatus[s] || 0;
                  const pct = stats.total ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={s} className="rep-bar">
                      <div className="rep-bar__head">
                        <span>{STATUS_LABELS[s]}</span>
                        <span className="rep-bar__count">{count}</span>
                      </div>
                      <div className="rep-bar__track">
                        <div className={`rep-bar__fill status-${s}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="rep-panel">
            <h2 className="rep-panel__title">Ближайшие дедлайны</h2>
            {upcoming.length === 0 ? (
              <p className="rep-empty">Нет предстоящих дедлайнов — всё под контролем.</p>
            ) : (
              <ul className="rep-list">
                {upcoming.map((t) => (
                  <li key={t.id} className="rep-list__item">
                    <span className={`rep-list__dot status-${t.status}`} />
                    <span className="rep-list__name">{t.title}</span>
                    <span className={`rep-list__date ${getDeadlineStatus(t.deadline)}`}>
                      {formatDate(t.deadline)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};