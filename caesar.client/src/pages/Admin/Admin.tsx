import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import './Admin.css';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  projects?: number;
  status?: string;
}

interface AdminProject {
  id: number;
  name: string;
  users?: number;
  tasks?: number;
  status?: string;
}

export const Admin = (_props: { onBack?: () => void }) => {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [u, p] = await Promise.all([api.getUsers(), api.getProjects()]);
      setUsers(u as AdminUser[]);
      setProjects(p as AdminProject[]);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const totalTasks = projects.reduce((sum, p) => sum + (p.tasks ?? 0), 0);

  return (
    <div className="admin-container">
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__number">{users.length}</span>
          <span className="admin-stat__label">Пользователей</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__number">{projects.length}</span>
          <span className="admin-stat__label">Проектов</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__number">{totalTasks}</span>
          <span className="admin-stat__label">Всего задач</span>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button
          className={`admin-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Проекты
        </button>
      </div>

      {loading && <div className="admin-state">Загрузка…</div>}
      {error && <div className="admin-state admin-state--error">{error}</div>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          {activeTab === 'users' ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Проекты</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email}</td>
                    <td><span className="admin-role">{user.role ?? '—'}</span></td>
                    <td>{user.projects ?? '—'}</td>
                    <td>
                      <span className={`admin-status ${user.status === 'Заблокирован' ? 'blocked' : 'active'}`}>
                        {user.status ?? 'Активен'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-action" title="Редактировать">✎</button>
                      <button className="admin-action admin-action--block" title="Заблокировать">⦸</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Участников</th>
                  <th>Задач</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td><strong>{project.name}</strong></td>
                    <td>{project.users ?? '—'}</td>
                    <td>{project.tasks ?? '—'}</td>
                    <td>
                      <span className={`admin-status ${project.status === 'Архивирован' ? 'archived' : 'active'}`}>
                        {project.status ?? 'Активен'}
                      </span>
                    </td>
                    <td>
                      <button className="admin-action" title="Редактировать">✎</button>
                      <button className="admin-action admin-action--delete" title="Удалить">🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
