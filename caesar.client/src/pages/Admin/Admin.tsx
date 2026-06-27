import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import './Admin.css';

// Определяем свои интерфейсы для админ-панели
interface AdminUser {
  id: number;
  username: string;
  email: string;
  role?: string;
  projectCount?: number;
  status?: 'active' | 'blocked';
}

interface AdminProject {
  id: number;
  name: string;
  theme?: string;
  userCount?: number;
  taskCount?: number;
  status?: 'active' | 'archived';
}

interface AdminProps {
  onBack?: () => void;
}

export const Admin = ({ onBack }: AdminProps) => {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [usersResponse, projectsResponse] = await Promise.all([
        api.getUsers(),
        api.getProjects()
      ]);
      
      // Трансформация данных для админ-панели
      const transformedUsers: AdminUser[] = (usersResponse.data || []).map((user: any) => ({
        id: user.id,
        username: user.username || user.userName || 'Пользователь',
        email: user.email || '',
        role: user.role || 'Пользователь',
        projectCount: user.projectCount || 0,
        status: user.status || 'active'
      }));

      const transformedProjects: AdminProject[] = (projectsResponse.data || []).map((project: any) => ({
        id: project.id,
        name: project.name || 'Без названия',
        theme: project.theme || '',
        userCount: project.userCount || 0,
        taskCount: project.taskCount || 0,
        status: project.status || 'active'
      }));

      setUsers(transformedUsers);
      setProjects(transformedProjects);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
      setUsers([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const handleBlockUser = async (_userId: number) => {
    if (!confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return;
    try {
      // TODO: Добавить метод блокировки пользователя в API
      // await api.blockUser(userId);
      await load(); // Обновляем список
    } catch (err) {
      console.error('Ошибка блокировки пользователя:', err);
      alert('Не удалось заблокировать пользователя');
    }
  };

  const handleDeleteProject = async (_projectId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;
    try {
      // TODO: Добавить метод удаления проекта в API
      // await api.deleteProject(projectId);
      await load(); // Обновляем список
    } catch (err) {
      console.error('Ошибка удаления проекта:', err);
      alert('Не удалось удалить проект');
    }
  };

  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount ?? 0), 0);

  return (
    <div className="admin-container">
      {onBack && (
        <button className="admin-back" onClick={onBack}>
          ← Назад
        </button>
      )}

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
                  <th>Проектов</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.email}</td>
                    <td><span className="admin-role">{user.role || 'Пользователь'}</span></td>
                    <td>{user.projectCount ?? 0}</td>
                    <td>
                      <span className={`admin-status ${user.status === 'blocked' ? 'blocked' : 'active'}`}>
                        {user.status === 'blocked' ? 'Заблокирован' : 'Активен'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="admin-action" 
                        title="Редактировать"
                        onClick={() => setEditingUser(user)}
                      >
                        ✎
                      </button>
                      {user.status !== 'blocked' && (
                        <button 
                          className="admin-action admin-action--block" 
                          title="Заблокировать"
                          onClick={() => handleBlockUser(user.id)}
                        >
                          ⦸
                        </button>
                      )}
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
                  <th>Тема</th>
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
                    <td>{project.theme || '—'}</td>
                    <td>{project.userCount ?? 0}</td>
                    <td>{project.taskCount ?? 0}</td>
                    <td>
                      <span className={`admin-status ${project.status === 'archived' ? 'archived' : 'active'}`}>
                        {project.status === 'archived' ? 'Архивирован' : 'Активен'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="admin-action" 
                        title="Редактировать"
                        onClick={() => setEditingProject(project)}
                      >
                        ✎
                      </button>
                      <button 
                        className="admin-action admin-action--delete" 
                        title="Удалить"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TODO: Добавить модальные окна для редактирования */}
      {editingUser && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <h3>Редактирование пользователя</h3>
            <p>ID: {editingUser.id}</p>
            <p>Имя: {editingUser.username}</p>
            <p>Email: {editingUser.email}</p>
            <button onClick={() => setEditingUser(null)}>Закрыть</button>
          </div>
        </div>
      )}

      {editingProject && (
        <div className="admin-modal">
          <div className="admin-modal__content">
            <h3>Редактирование проекта</h3>
            <p>ID: {editingProject.id}</p>
            <p>Название: {editingProject.name}</p>
            <p>Тема: {editingProject.theme || '—'}</p>
            <button onClick={() => setEditingProject(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};