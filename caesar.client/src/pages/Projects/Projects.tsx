import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../context/ApiContext';
import './Projects.css';

interface Project {
  id: number;
  name: string;
  theme: string;
  createdAt: string;
  role: string;
  tasksCount: number;
  status?: string;
}

interface ProjectsProps {
  onSelectProject: (projectId: number) => void;
  onCreateProject?: () => void;
}

export const Projects = ({ onSelectProject, onCreateProject }: ProjectsProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const api = useApi();
  
  // ИСПРАВЛЕННАЯ СТРОКА (заменили NodeJS.Timeout на any)
  const reloadTimerRef = useRef<any | null>(null);

  const loadProjects = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      console.log('📦 Запрашиваю список проектов с бэкенда (реальные данные)...');
      
      // ВАЖНО: Это реальный вызов API. Моков больше нет.
      const data = await api.getProjects();
      
      console.log('✅ Проекты получены с сервера:', data);
      setProjects(data);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки проектов:', err);
      setError(err.message || 'Ошибка загрузки проектов');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [api]);

  // Загрузка при первом заходе
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Ловушка на возврат (стрелочка назад и свайпы)
  useEffect(() => {
    const handleLocationChange = () => {
      if (document.visibilityState === 'visible') {
        if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
        
        reloadTimerRef.current = setTimeout(() => {
          console.log('🔙 Обнаружен возврат на страницу проектов. Принудительно обновляю данные...');
          loadProjects(false);
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleLocationChange);
    window.addEventListener('popstate', () => {
      if (document.visibilityState === 'visible') {
        handleLocationChange();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, [loadProjects]);

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    }
  };

  if (loading && projects.length === 0) {
    return (
      <div className="projects-container">
        <div className="projects-loading">Загрузка проектов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-container">
        <div className="projects-error">
          ❌ {error}
          <button onClick={() => loadProjects()}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1>📋 Мои проекты</h1>
        <button className="create-project-btn" onClick={handleCreateProject}>
          + Создать проект
        </button>
      </div>

      {loading && projects.length > 0 && (
        <div className="projects-updating">🔄 Обновление списка...</div>
      )}

      {projects.length === 0 ? (
        <div className="projects-empty">
          <p>У вас пока нет проектов</p>
          <button className="create-project-btn" onClick={handleCreateProject}>
            Создать первый проект
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => onSelectProject(project.id)}
            >
              <div className="project-card__header">
                <span className="project-card__theme">{project.theme}</span>
                <span className="project-card__role">{project.role}</span>
              </div>
              <h3 className="project-card__name">{project.name}</h3>
              <div className="project-card__stats">
                <span>📅 {project.createdAt}</span>
                <span>📌 {project.tasksCount} задач</span>
              </div>
              {project.status && (
                <div className="project-card__status">
                  <span className={`status-badge ${project.status === 'Активен' ? 'active' : 'archived'}`}>
                    {project.status}
                  </span>
                </div>
              )}
              <div className="project-card__footer">
                <span className="project-card__enter">Перейти →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};