import { useState } from 'react';
import './Admin.css';

// Мок-данные
const MOCK_USERS = [
  { id: 1, username: 'Иван Петров', email: 'ivan@example.com', role: 'Главный администратор', projects: 4, status: 'Активен' },
  { id: 2, username: 'Мария Смирнова', email: 'maria@example.com', role: 'Разработчик', projects: 2, status: 'Активен' },
  { id: 3, username: 'Алексей Иванов', email: 'alex@example.com', role: 'Тестировщик', projects: 1, status: 'Активен' },
  { id: 4, username: 'Елена Петрова', email: 'elena@example.com', role: 'Наблюдатель', projects: 1, status: 'Заблокирован' },
];

const MOCK_PROJECTS_ADMIN = [
  { id: 1, name: 'CAESAR Web App', users: 4, tasks: 12, status: 'Активен' },
  { id: 2, name: 'Маркетинговая кампания', users: 3, tasks: 8, status: 'Активен' },
  { id: 3, name: 'Старый проект', users: 2, tasks: 0, status: 'Архивирован' },
];

interface AdminProps {
  onBack: () => void;
}

export const Admin = ({ onBack }: AdminProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button className="admin-back" onClick={onBack}>← Назад</button>
        <h1>🛡️ Панель супер-админа</h1>
        <span className="admin-badge">Администратор</span>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__number">4</span>
          <span className="admin-stat__label">Пользователей</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__number">3</span>
          <span className="admin-stat__label">Проектов</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__number">20</span>
          <span className="admin-stat__label">Всего задач</span>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Пользователи
        </button>
        <button 
          className={`admin-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📋 Проекты
        </button>
      </div>

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
              {MOCK_USERS.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.username}</strong></td>
                  <td>{user.email}</td>
                  <td><span className="admin-role">{user.role}</span></td>
                  <td>{user.projects}</td>
                  <td>
                    <span className={`admin-status ${user.status === 'Активен' ? 'active' : 'blocked'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button className="admin-action admin-action--edit">✏️</button>
                    <button className="admin-action admin-action--block">🔒</button>
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
              {MOCK_PROJECTS_ADMIN.map(project => (
                <tr key={project.id}>
                  <td><strong>{project.name}</strong></td>
                  <td>{project.users}</td>
                  <td>{project.tasks}</td>
                  <td>
                    <span className={`admin-status ${project.status === 'Активен' ? 'active' : 'archived'}`}>
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <button className="admin-action admin-action--edit">✏️</button>
                    <button className="admin-action admin-action--delete">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};