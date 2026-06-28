import { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { Icon } from '../../components/Icon/Icon';
import './ProjectSetup.css';

interface ProjectSetupProps {
  onProjectCreated: (projectName: string, theme: string, pageId: number) => void;
}

export const ProjectSetup = ({ onProjectCreated }: ProjectSetupProps) => {
  const [projectName, setProjectName] = useState('');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectName.trim()) {
      setError('Введите название проекта');
      return;
    }

    try {
      setLoading(true);

      // 1. Создаем проект
      const projectResponse = await api.createProject({
        name: projectName.trim(),
        theme: theme.trim() || null,
      });
      
      const createdProject = projectResponse.data;
      const projectId = createdProject.id;

      // 2. Создаем страницу для проекта
      const pageResponse = await api.createProjectPage({
        name: 'Основная доска',
        projectId: projectId,
      });

      const createdPage = pageResponse.data;
      const pageId = createdPage.id;

      // 3. Передаем ID страницы в родительский компонент
      onProjectCreated(
        createdProject.name || projectName.trim(),
        createdProject.theme || theme.trim() || 'Без темы',
        pageId
      );

    } catch (err: any) {
      console.error('Ошибка создания проекта:', err);
      setError(err.message || 'Произошла ошибка при создании проекта');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <h1 className="setup-title"><Icon name="rocket" size={24} /> Создай свой проект</h1>
        <p className="setup-subtitle">Заполните данные для создания нового проекта</p>

        {error && <div className="setup-error">{error}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="projectName">Название проекта *</label>
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
            <label htmlFor="theme">Тема проекта (необязательно)</label>
            <input
              id="theme"
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Например: Разработка, Дизайн, Маркетинг..."
              className="setup-input"
              disabled={loading}
            />
            <small className="setup-hint">Укажите тему, чтобы лучше организовать проект</small>
          </div>

          <button type="submit" className="setup-button" disabled={loading}>
            {loading ? 'Создание...' : 'Создать проект →'}
          </button>
        </form>
      </div>
    </div>
  );
};