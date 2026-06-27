import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../context/ApiContext';
import { STATUS_LABELS, STATUS_ORDER } from '../../types';
import type { Task, TaskStatus } from '../../types';
import { getDeadlineStatus, formatDate } from '../../utils/dateHelpers';
import './Reports.css';

export const Reports = () => {
  const api = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getTasks(1)
      .then((data) => { if (active) setTasks(data as Task[]); })
      .catch((e: any) => { if (active) setError(e.message || 'Не удалось загрузить задачи'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api]);

  const stats = useMemo(() => {
    const byStatus: Record<TaskStatus, number> = { preparation: 0, execution: 0, testing: 0, done: 0 };
    let overdue = 0, soon = 0;
    for (const t of tasks) {
      if (t.status in byStatus) byStatus[t.status as TaskStatus]++;
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
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
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
                  const count = stats.byStatus[s];
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
