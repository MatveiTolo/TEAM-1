import { useState, useEffect, useMemo } from 'react';
import { useApi } from '../../context/ApiContext';
import { STATUS_LABELS } from '../../types';
import type { Task, TaskStatus } from '../../types';
import './Calendar.css';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Маппинг статусов из чисел в строки (если бэкенд возвращает числа)
const INT_TO_STATUS: Record<number, string> = {
  1: 'preparation',
  2: 'execution',
  3: 'testing',
  4: 'done',
};

// Нормализация задачи для календаря
const normalizeTaskForCalendar = (raw: any): Task => {
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

interface CalendarProps {
  projectId?: number | null;
}

export const Calendar = ({ projectId }: CalendarProps) => {
  const api = useApi();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      setError('');
      return;
    }
    let active = true;
    setLoading(true);

    api.getTasksByProject(projectId)
      .then((response: any) => {
        if (active) {
          const normalizedTasks = (response.data || []).map(normalizeTaskForCalendar);
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
  }, [api, projectId]);

  // Группируем задачи по дню дедлайна
  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.deadline) continue;
      const d = new Date(t.deadline);
      const key = toKey(d);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = new Date();

  // Строим сетку (понедельник — первый день)
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7; // 0=Пн
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(year, month, d));
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [year, month]);

  const shift = (delta: number) => setCursor(new Date(year, month + delta, 1));

  const getStatusLabel = (status: string) => {
    return STATUS_LABELS[status as TaskStatus] || status;
  };

  return (
    <div className="calendar-container">
      <div className="cal-head">
        <div>
          <h1 className="cal-title">{MONTHS[month]} {year}</h1>
          <p className="cal-sub">Задачи с дедлайнами на этот месяц</p>
        </div>
        <div className="cal-nav">
          <button onClick={() => shift(-1)} aria-label="Предыдущий месяц">‹</button>
          <button className="cal-today" onClick={() => setCursor(new Date())}>Сегодня</button>
          <button onClick={() => shift(1)} aria-label="Следующий месяц">›</button>
        </div>
      </div>

      {!projectId && <div className="cal-loading">Проект не выбран</div>}
      {projectId && loading && <div className="cal-loading">Загрузка задач...</div>}
      {error && <div className="cal-error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="cal-grid cal-grid--head">
            {WEEKDAYS.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
          </div>

          <div className="cal-grid">
            {cells.map((date, i) => {
              if (!date) return <div key={i} className="cal-cell cal-cell--empty" />;
              const dayTasks = byDay.get(toKey(date)) ?? [];
              const isToday = toKey(date) === toKey(today);
              return (
                <div key={i} className={`cal-cell${isToday ? ' is-today' : ''}`}>
                  <span className="cal-cell__day">{date.getDate()}</span>
                  <div className="cal-cell__tasks">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span 
                        key={t.id} 
                        className={`cal-chip status-${t.status}`} 
                        title={`${t.title} — ${getStatusLabel(t.status)}`}
                      >
                        {t.title}
                      </span>
                    ))}
                    {dayTasks.length > 3 && <span className="cal-more">+{dayTasks.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cal-legend">
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <span key={s} className="cal-legend__item">
                <span className={`cal-dot status-${s}`} />
                {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};