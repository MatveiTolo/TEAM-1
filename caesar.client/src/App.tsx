import { useState } from 'react';
import './App.css';
import { Board } from './components/Board/Board';
import { ProjectSetup } from './pages/ProjectSetup/ProjectSetup';

function App() {
  const [isProjectCreated, setIsProjectCreated] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectTheme, setProjectTheme] = useState('');
  const [projectRoles, setProjectRoles] = useState<string[]>([]);

  const handleProjectCreated = (name: string, theme: string, roles?: string[]) => {
    setProjectName(name);
    setProjectTheme(theme);
    setProjectRoles(roles || []);
    setIsProjectCreated(true);
  };

  if (!isProjectCreated) {
    return <ProjectSetup onProjectCreated={handleProjectCreated} />;
  }

  return (
    <div className="App">
      <div className="app-header">
        <h2>📋 {projectName}</h2>
        <span className="app-theme-badge">{projectTheme}</span>
      </div>
      <Board />
    </div>
  );
}

export default App;