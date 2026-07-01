import { useState, useEffect } from 'react';
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
import type { User } from './types';

type Screen =
  | 'landing' | 'login' | 'register'
  | 'projects' | 'setup' | 'board'
  | 'profile' | 'admin' | 'invite'
  | 'calendar' | 'reports' | 'error';

function App() {
  const api = useApi();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectTheme, setProjectTheme] = useState('');
  // Задача 1/4: трекаем именно проект, а не только страницу №1.
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await api.getCurrentUser();
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
      }
    };
    const token = localStorage.getItem('caesar_token');
    if (token) loadCurrentUser();
  }, [api]);

  const handleLogin = () => {
    const token = localStorage.getItem('caesar_token');
    if (!token) {
      setCurrentScreen('login');
      return;
    }
    api.getCurrentUser()
      .then((response: any) => {
        setCurrentUser(response.data);
        setCurrentScreen('projects');
      })
      .catch(() => setCurrentScreen('projects'));
  };

  const handleProjectCreated = (projectId: number, name: string, theme: string, pageId: number) => {
    setSelectedProjectId(projectId);
    setSelectedPageId(pageId);
    setProjectName(name);
    setProjectTheme(theme);
    setCurrentScreen('board');
  };

  const handleSelectProject = async (
    projectId: number,
    name?: string,
    theme?: string,
  ) => {
    // Открываем ИМЕННО выбранный проект: сохраняем его id и первую доску.
    // Раньше без projectId контекст всегда сваливался на страницу №1.
    setSelectedProjectId(projectId);
    setProjectName(name || 'Проект');
    setProjectTheme(theme || '');
    try {
      const response = await api.getProjectPages(projectId);
      const pages = response.data || [];
      if (pages.length > 0) {
        setSelectedPageId(pages[0].id);
        setCurrentScreen('board');
      } else {
        // Досок ещё нет — Board сам создаст первую.
        setSelectedPageId(null);
        setCurrentScreen('board');
      }
    } catch (error) {
      console.error('Ошибка загрузки страниц проекта:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('caesar_token');
    setCurrentUser(null);
    setSelectedProjectId(null);
    setSelectedPageId(null);
    setCurrentScreen('landing');
  };

  const navigate = (page: string) => setCurrentScreen(page as Screen);

  // ============ Публичные экраны ============
  if (currentScreen === 'landing') return <Landing onNavigate={navigate} />;
  if (currentScreen === 'login') return <Login onLogin={handleLogin} onNavigate={navigate} />;
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
  const shellProps = { onNavigate: navigate, onLogout: handleLogout };

  if (currentScreen === 'projects') {
    return (
      <AppShell {...shellProps} title={currentUser?.username || 'Пользователь'} subtitle="Рабочее пространство" active="projects">
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
        <Board
          projectId={selectedProjectId}
          initialPageId={selectedPageId}
          onActivePageChange={setSelectedPageId}
        />
      </AppShell>
    );
  }

  if (currentScreen === 'calendar') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Календарь" subtitle={projectName} active="calendar">
        <Calendar projectId={selectedProjectId} />
      </AppShell>
    );
  }

  if (currentScreen === 'reports') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Отчёты" subtitle={projectName} active="reports">
        <Reports projectId={selectedProjectId} />
      </AppShell>
    );
  }

  if (currentScreen === 'profile') {
    const userForProfile = {
      id: currentUser?.id || 0,
      username: currentUser?.username || 'Пользователь',
      email: currentUser?.email || '',
      role: currentUser?.role || 'Участник',
      createdAt: currentUser?.createdAt
        ? new Date(currentUser.createdAt).toLocaleDateString('ru-RU', {
            day: '2-digit', month: 'long', year: 'numeric',
          })
        : '—',
      projectsCount: currentUser?.projectsCount ?? 0,
    };
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Профиль" active="profile">
        <UserProfile user={userForProfile} onLogout={handleLogout} />
      </AppShell>
    );
  }

  if (currentScreen === 'admin') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Панель администратора" active="admin">
        <Admin />
      </AppShell>
    );
  }

  return null;
}

export default App;
