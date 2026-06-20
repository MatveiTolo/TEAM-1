import { useState } from 'react';
import './App.css';
import { Board } from './components/Board/Board';
import { ProjectSetup } from './pages/ProjectSetup/ProjectSetup';
import { Login } from './pages/Login/Login';
import { Projects } from './pages/Projects/Projects';
import { UserProfile } from './pages/UserProfile/UserProfile';
import { Admin } from './pages/Admin/Admin';
import { useApi } from './context/ApiContext';

type Screen = 'login' | 'projects' | 'setup' | 'board' | 'profile' | 'admin';

function App() {
  const api = useApi();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [projectTheme, setProjectTheme] = useState('');

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setCurrentScreen('projects');
  };

  const handleProjectCreated = (name: string, theme: string) => {
    setProjectName(name);
    setProjectTheme(theme);
    setCurrentScreen('board');
  };

  const handleSelectProject = () => {
    setCurrentScreen('board');
  };

  const handleLogout = () => {
    setCurrentUser('');
    setCurrentScreen('login');
  };

  if (currentScreen === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  if (currentScreen === 'projects') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        <div className="app-topbar">
          <span className="app-topbar__user">👤 {currentUser}</span>
          <div className="app-topbar__actions">
            <button onClick={() => setCurrentScreen('profile')}>👤 Профиль</button>
            <button onClick={() => setCurrentScreen('admin')}>🛡️ Админ</button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>
        </div>
        <Projects onSelectProject={handleSelectProject} />
      </div>
    );
  }

  if (currentScreen === 'setup') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        <ProjectSetup onProjectCreated={handleProjectCreated} />
      </div>
    );
  }

  if (currentScreen === 'board') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        <div className="app-topbar">
          <button className="app-topbar__back" onClick={() => setCurrentScreen('projects')}>←</button>
          <span className="app-topbar__project">📋 {projectName || 'Проект'}</span>
          <span className="app-topbar__theme">{projectTheme}</span>
          <div className="app-topbar__actions">
            <button onClick={() => setCurrentScreen('profile')}>👤 Профиль</button>
            <button onClick={() => setCurrentScreen('admin')}>🛡️ Админ</button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>
        </div>
        <Board />
      </div>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        <UserProfile 
          user={{
            id: 1,
            username: currentUser || 'Пользователь',
            email: 'user@example.com',
            role: 'Главный администратор',
            createdAt: '01.01.2026',
            projectsCount: 4,
          }}
          onLogout={handleLogout}
          onBack={() => setCurrentScreen('projects')}
        />
      </div>
    );
  }

  if (currentScreen === 'admin') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        <Admin onBack={() => setCurrentScreen('projects')} />
      </div>
    );
  }

  return null;
}

export default App;