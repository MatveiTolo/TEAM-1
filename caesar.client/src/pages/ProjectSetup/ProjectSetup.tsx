import { useState } from 'react';
import './ProjectSetup.css';

interface ProjectSetupProps {
  onProjectCreated: (projectName: string, theme: string, customRoles?: string[]) => void;
}

const DEFAULT_THEMES = [
  { 
    id: 'it', 
    name: '💻 IT-проект', 
    description: 'Разработка ПО, баги, спринты', 
    roles: ['Главный администратор', 'Администратор страницы', 'Разработчик', 'Тестировщик', 'Наблюдатель'] 
  },
  { 
    id: 'marketing', 
    name: '📊 Маркетинг', 
    description: 'Кампании, контент, аналитика', 
    roles: ['Руководитель', 'Маркетолог', 'Дизайнер', 'Наблюдатель'] 
  },
  { 
    id: 'design', 
    name: '🎨 Дизайн', 
    description: 'Прототипы, макеты, ревью', 
    roles: ['Арт-директор', 'Дизайнер', 'Клиент', 'Наблюдатель'] 
  },
  { 
    id: 'education', 
    name: '📚 Образование', 
    description: 'Курсы, задания, успеваемость', 
    roles: ['Преподаватель', 'Студент', 'Ассистент', 'Наблюдатель'] 
  },
];

export const ProjectSetup = ({ onProjectCreated }: ProjectSetupProps) => {
  const [projectName, setProjectName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('it');
  const [customRoles, setCustomRoles] = useState<string[]>(['Админ', 'Разработчик', 'Тестировщик', 'Наблюдатель']);
  const [newRole, setNewRole] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddRole = () => {
    if (newRole.trim() && !customRoles.includes(newRole.trim())) {
      setCustomRoles([...customRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setCustomRoles(customRoles.filter(r => r !== role));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');


    if (!projectName.trim()) {
      setError('Введите название проекта');
      return;
    }

    let themeName = '';
    let roles: string[] = [];

    if (isCustomMode) {
      themeName = '🎨 Своя тема';
      roles = customRoles;
    } else {
      const theme = DEFAULT_THEMES.find(t => t.id === selectedTheme);
      themeName = theme?.name || 'IT-проект';
      roles = theme?.roles || [];
    }


    try {
      setLoading(true);

      const token = localStorage.getItem('caesar_token');

      if (!token) {
        throw new Error('Токен не найден. Пожалуйста, войдите заново.');
      }

      const requestBody = {
        name: projectName.trim(),
        theme: themeName,
      };


      const response = await fetch('/api/Projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });


      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${responseText}`);
      }

      onProjectCreated(projectName.trim(), themeName, roles);

    } catch (err: any) {
      console.error('🔴 ОШИБКА:', err);
      setError(err.message || 'Произошла ошибка при создании проекта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1 className="setup-title">🚀 Создай свой проект</h1>
        <p className="setup-subtitle">Выбери готовую тему или создай свою!</p>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="projectName">Название проекта</label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Например: Мой крутой проект"
              className="setup-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <div className="theme-toggle">
              <button
                type="button"
                className={`theme-toggle-btn ${!isCustomMode ? 'active' : ''}`}
                onClick={() => setIsCustomMode(false)}
                disabled={loading}
              >
                📋 Готовые темы
              </button>
              <button
                type="button"
                className={`theme-toggle-btn ${isCustomMode ? 'active' : ''}`}
                onClick={() => setIsCustomMode(true)}
                disabled={loading}
              >
                ✏️ Своя тема
              </button>
            </div>
          </div>

          {!isCustomMode ? (
            <div className="form-group">
              <label>Выбери тему</label>
              <div className="theme-grid">
                {DEFAULT_THEMES.map((theme) => (
                  <div
                    key={theme.id}
                    className={`theme-card ${selectedTheme === theme.id ? 'theme-card--selected' : ''}`}
                    onClick={() => !loading && setSelectedTheme(theme.id)}
                  >
                    <div className="theme-card__emoji">{theme.name.split(' ')[0]}</div>
                    <h3 className="theme-card__name">{theme.name}</h3>
                    <p className="theme-card__description">{theme.description}</p>
                    <div className="theme-card__roles">
                      {theme.roles.map((role, idx) => (
                        <span key={idx} className="theme-card__role">{role}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Твои роли</label>
              <div className="custom-roles">
                <div className="custom-roles__list">
                  {customRoles.map((role) => (
                    <span key={role} className="custom-role">
                      {role}
                      <button
                        type="button"
                        className="custom-role__remove"
                        onClick={() => handleRemoveRole(role)}
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <div className="custom-roles__add">
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Название роли"
                    className="setup-input"
                    disabled={loading}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  />
                  <button type="button" onClick={handleAddRole} className="add-role-btn" disabled={loading}>
                    + Добавить
                  </button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="setup-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать проект →'}
          </button>
        </form>
      </div>
    </div>
  );
};