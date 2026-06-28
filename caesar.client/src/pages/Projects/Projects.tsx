import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../context/ApiContext';
import { Icon } from '../../components/Icon/Icon';
import './Projects.css';

interface Project {
  id: number;
  name: string;
  theme?: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
  tasksCount?: number;
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

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.getProjects();
      const data = response.data || [];
      
      setProjects(data);
    } catch (err: any) {
      console.error('Ошибка загрузки проектов:', err);
      setError(err.message || 'Ошибка загрузки проектов');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = () => {
    if (onCreateProject) {
      onCreateProject();
    }
  };

  if (loading) {
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
          <span className="projects-error__icon"><Icon name="alert" size={18} /></span> {error}
          <button onClick={() => loadProjects()}>Повторить</button>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-container">
      <div className="projects-header">
        <h1><Icon name="board" size={22} /> Мои проекты</h1>
        <button className="create-project-btn" onClick={handleCreateProject}>
          + Создать проект
        </button>
      </div>

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
                {project.theme && (
                  <span className="project-card__theme">{project.theme}</span>
                )}
                <span className="project-card__role">{project.role || 'Участник'}</span>
              </div>
              <h3 className="project-card__name">{project.name}</h3>
              <div className="project-card__stats">
                <span><Icon name="calendar" size={14} /> {project.createdAt || project.created_at || '—'}</span>
                <span><Icon name="tasks" size={14} /> {project.tasksCount || 0} задач</span>
              </div>
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