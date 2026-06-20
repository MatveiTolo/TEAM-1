import { useState, useEffect } from 'react';
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
}

export const Projects = ({ onSelectProject }: ProjectsProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const api = useApi();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects();
      setProjects(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки проектов');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    window.location.href = '/setup';
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
          ❌ {error}
          <button onClick={loadProjects}>Повторить</button>
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