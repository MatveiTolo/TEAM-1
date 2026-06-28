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
  const [selectedPageId, setSelectedPageId] = useState<number>(1);

  // Загрузка текущего пользователя при монтировании
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        console.log('Загрузка текущего пользователя...');
        const response = await api.getCurrentUser();
        console.log('Пользователь загружен:', response.data);
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
      }
    };
    
    const token = localStorage.getItem('caesar_token');
    console.log('Токен при монтировании:', token ? 'присутствует' : 'отсутствует');
    if (token) {
      loadCurrentUser();
    }
  }, [api]);

  const handleLogin = (username: string) => {
    console.log('handleLogin вызван с username:', username);
    
    // Проверяем, что токен сохранился
    const token = localStorage.getItem('caesar_token');
    console.log('Токен в handleLogin:', token ? 'присутствует' : 'отсутствует');
    
    if (!token) {
      console.warn('Токен отсутствует после входа!');
      // Если токена нет, перенаправляем на логин
      setCurrentScreen('login');
      return;
    }
    
    // Загружаем данные пользователя
    api.getCurrentUser()
      .then((response: any) => {
        console.log('Данные пользователя загружены:', response.data);
        setCurrentUser(response.data);
        setCurrentScreen('projects');
      })
      .catch((error: any) => {
        console.error('Ошибка загрузки пользователя после входа:', error);
        // Даже при ошибке переходим на проекты
        setCurrentScreen('projects');
      });
  };

  const handleProjectCreated = (name: string, theme: string, pageId: number) => {
    setProjectName(name);
    setProjectTheme(theme);
    setSelectedPageId(pageId);
    setCurrentScreen('board');
  };

  const handleSelectProject = (_projectId: number) => {
    // TODO: Загрузить страницы проекта и выбрать первую
    setSelectedPageId(1);
    setCurrentScreen('board');
  };

  const handleLogout = () => {
    localStorage.removeItem('caesar_token');
    setCurrentUser(null);
    setCurrentScreen('landing');
  };

  const navigate = (page: string) => setCurrentScreen(page as Screen);

  // ============ Публичные экраны ============
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
  };

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
        <Board pageId={selectedPageId} />
      </AppShell>
    );
  }

  if (currentScreen === 'calendar') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Календарь" active="calendar">
        <Calendar pageId={selectedPageId} />
      </AppShell>
    );
  }

  if (currentScreen === 'reports') {
    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Отчёты" active="reports">
        <Reports pageId={selectedPageId} />
      </AppShell>
    );
  }

  if (currentScreen === 'profile') {
    const userForProfile = {
      id: currentUser?.id || 0,
      username: currentUser?.username || 'Пользователь',
      email: currentUser?.email || '',
      role: currentUser?.role || 'Участник',
      createdAt: new Date().toLocaleDateString('ru-RU'),
      projectsCount: 0,
    };

    return (
      <AppShell {...shellProps} onBack={() => setCurrentScreen('projects')} title="Профиль" active="profile">
        <UserProfile
          user={userForProfile}
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