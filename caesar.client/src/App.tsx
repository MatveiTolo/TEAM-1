import { useState } from 'react';
import { AppShell } from './components/AppShell/AppShell';
import { Board } from './components/Board/Board';
import { ProjectSetup } from './pages/ProjectSetup/ProjectSetup';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Projects } from './pages/Projects/Projects';
import { UserProfile } from './pages/UserProfile/UserProfile';
import { Admin } from './pages/Admin/Admin';
import { Landing } from './pages/Landing/Landing';
import { Invite } from './pages/Invite/Invite';
import { Calendar } from './pages/Calendar/Calendar';
import { Reports } from './pages/Reports/Reports';
import { Error } from './pages/Error/Error';
import { useApi } from './context/ApiContext';

type Screen =
  | 'landing' | 'login' | 'register'
  | 'projects' | 'setup' | 'board'
  | 'profile' | 'admin' | 'invite'
  | 'calendar' | 'reports' | 'error';

function App() {
  const api = useApi();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
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

  const handleSelectProject = () => setCurrentScreen('board');

  const handleLogout = () => {
    localStorage.removeItem('caesar_token');
    setCurrentUser('');
    setCurrentScreen('landing');
  };

  const navigate = (page: string) => setCurrentScreen(page as Screen);

  // ============ Публичные экраны (свой собственный фон) ============
  if (currentScreen === 'landing') {
    return <Landing onNavigate={navigate} />;
  }

  if (currentScreen === 'login') {
    return <Login onLogin={handleLogin} onNavigate={navigate} />;
  }

  if (currentScreen === 'register') {
    return (
      <Register
        onRegister={handleLogin}
        onBack={() => setCurrentScreen('login')}
        onNavigate={navigate}
      />
    );
  }

  if (currentScreen === 'invite') {
    return (
      <Invite
        onAccept={() => setCurrentScreen('projects')}
        onReject={() => setCurrentScreen('projects')}
      />
    );
  }

  if (currentScreen === 'error') {
    return <Error code={404} onGoHome={() => setCurrentScreen('projects')} />;
  }

  // ============ Приложение (общий каркас AppShell) ============
  const shellProps = {
    onNavigate: navigate,
    onLogout: handleLogout,
    isMock: api.isMockMode,
  };

  if (currentScreen === 'projects') {
    return (
      <AppShell {...shellProps} title={currentUser} subtitle="Рабочее пространство" active="projects">
        <Projects
          onSelectProject={handleSelectProject}
          onCreateProject={() => setCurrentScreen('setup')}
        />
      </AppShell>
    );
  }

  if (currentScreen === 'setup') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Новый проект" minimalNav>
        <ProjectSetup onProjectCreated={handleProjectCreated} />
      </AppShell>
    );
  }

  if (currentScreen === 'board') {
    return (
      <AppShell
        {...shellProps}
        onBack={() => setCurrentScreen('projects')}
        title={projectName || 'Проект'}
        subtitle={projectTheme}
        active="projects"
      >
        <Board pageId={1} />
      </AppShell>
    );
  }

  if (currentScreen === 'calendar') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Календарь" active="calendar">
        <Calendar />
      </AppShell>
    );
  }

  if (currentScreen === 'reports') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Отчёты" active="reports">
        <Reports />
      </AppShell>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Профиль" active="profile">
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
        />
      </AppShell>
    );
  }

  if (currentScreen === 'admin') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Панель администратора" active="admin">
        <Admin onBack={() => setCurrentScreen('projects')} />
      </AppShell>
    );
  }

  return null;
}

export default App;
