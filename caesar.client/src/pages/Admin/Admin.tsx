import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import { Icon } from '../../components/Icon/Icon';
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

export const Admin = () => {
  const api = useApi();
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setModalError('');
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    if (!editUsername.trim() || !editEmail.trim()) {
      setModalError('Все поля обязательны');
      return;
    }
    try {
      setSaving(true);
      setModalError('');
      await api.updateUser(editingUser.id, { userName: editUsername.trim(), email: editEmail.trim() });
      setEditingUser(null);
      await load();
    } catch (err: any) {
      setModalError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

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
        userCount: project.membersCount ?? project.userCount ?? 0,
        taskCount: project.tasksCount ?? project.taskCount ?? 0,
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

  const handleToggleBlock = async (user: AdminUser) => {
    const willBlock = user.status !== 'blocked';
    const msg = willBlock
      ? 'Заблокировать этого пользователя? Он не сможет войти в систему.'
      : 'Разблокировать этого пользователя?';
    if (!confirm(msg)) return;
    try {
      if (willBlock) await api.blockUser(user.id);
      else await api.unblockUser(user.id);
      await load();
    } catch (err: any) {
      alert(err.message || 'Операция не выполнена');
    }
  };

  const handleDeleteProject = async (_projectId: number) => {
    alert('Удаление проектов пока не поддерживается сервером.');
  };

  const totalTasks = projects.reduce((sum, p) => sum + (p.taskCount ?? 0), 0);

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
                        onClick={() => openEditUser(user)}
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button 
                        className={`admin-action ${user.status === 'blocked' ? '' : 'admin-action--block'}`}
                        title={user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
                        onClick={() => handleToggleBlock(user)}
                      >
                        <Icon name="ban" size={16} />
                      </button>
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
                        <Icon name="edit" size={16} />
                      </button>
                      <button 
                        className="admin-action admin-action--delete" 
                        title="Удалить"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Icon name="trash" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {editingUser && (
        <div className="admin-modal" onClick={() => !saving && setEditingUser(null)}>
          <div className="admin-modal__content" onClick={(e) => e.stopPropagation()}>
            <h3>Редактирование пользователя</h3>
            {modalError && <div className="admin-state admin-state--error">{modalError}</div>}
            <div className="admin-modal__field">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="admin-modal__field">
              <label>Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="admin-modal__actions">
              <button
                className="admin-modal__btn"
                onClick={() => setEditingUser(null)}
                disabled={saving}
              >
                Отмена
              </button>
              <button
                className="admin-modal__btn admin-modal__btn--primary"
                onClick={handleSaveUser}
                disabled={saving}
              >
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
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