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

  const handleAddRole = () => {
    if (newRole.trim() && !customRoles.includes(newRole.trim())) {
      setCustomRoles([...customRoles, newRole.trim()]);
      setNewRole('');
    }
  };

  const handleRemoveRole = (role: string) => {
    setCustomRoles(customRoles.filter(r => r !== role));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Введите название проекта');
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

    onProjectCreated(projectName, themeName, roles);
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1 className="setup-title">🚀 Создай свой проект</h1>
        <p className="setup-subtitle">Выбери готовую тему или создай свою!</p>

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
              required
            />
          </div>

          <div className="form-group">
            <div className="theme-toggle">
              <button
                type="button"
                className={`theme-toggle-btn ${!isCustomMode ? 'active' : ''}`}
                onClick={() => setIsCustomMode(false)}
              >
                📋 Готовые темы
              </button>
              <button
                type="button"
                className={`theme-toggle-btn ${isCustomMode ? 'active' : ''}`}
                onClick={() => setIsCustomMode(true)}
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
                    onClick={() => setSelectedTheme(theme.id)}
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
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
                  />
                  <button type="button" onClick={handleAddRole} className="add-role-btn">
                    + Добавить
                  </button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="setup-button">
            Создать проект →
          </button>
        </form>
      </div>
    </div>
  );
};