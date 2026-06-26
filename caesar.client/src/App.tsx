import { useState } from 'react';
import './App.css';
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
  | 'landing'
  | 'login'
  | 'register'
  | 'projects'
  | 'setup'
  | 'board'
  | 'profile'
  | 'admin'
  | 'invite'
  | 'calendar'
  | 'reports'
  | 'error';

function App() {
  const api = useApi();
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [currentUser, setCurrentUser] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [projectTheme, setProjectTheme] = useState('');

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setCurrentScreen('projects');
    console.log('🔑 Токен сохранён:', localStorage.getItem('caesar_token'));
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
    localStorage.removeItem('caesar_token');
    setCurrentUser('');
    setCurrentScreen('landing');
  };

  const handleNavigate = (page: string) => {
    setCurrentScreen(page as Screen);
  };

  // ========== Лендинг ==========
  if (currentScreen === 'landing') {
    return <Landing onNavigate={handleNavigate} />;
  }

  // ========== Вход ==========
  if (currentScreen === 'login') {
    return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
  }

  // ========== Регистрация ==========
  if (currentScreen === 'register') {
    return (
      <Register 
        onRegister={handleLogin} 
        onBack={() => setCurrentScreen('login')}
        onNavigate={handleNavigate}
      />
    );
  }

  // ========== Приглашение ==========
  if (currentScreen === 'invite') {
    return (
      <Invite 
        onAccept={() => {
          alert('✅ Приглашение принято!');
          setCurrentScreen('projects');
        }}
        onReject={() => {
          alert('❌ Приглашение отклонено');
          setCurrentScreen('projects');
        }}
      />
    );
  }

  // ========== Календарь ==========
  if (currentScreen === 'calendar') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
        <div className="app-topbar">
          <button className="app-topbar__back" onClick={() => setCurrentScreen('projects')}>←</button>
          <span className="app-topbar__user">📅 Календарь</span>
          <div className="app-topbar__actions">
            <button onClick={() => setCurrentScreen('profile')}>👤 Профиль</button>
            <button onClick={() => setCurrentScreen('admin')}>🛡️ Админ</button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>
        </div>
        <Calendar />
      </div>
    );
  }

  // ========== Отчёты ==========
  if (currentScreen === 'reports') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
        <div className="app-topbar">
          <button className="app-topbar__back" onClick={() => setCurrentScreen('projects')}>←</button>
          <span className="app-topbar__user">📊 Отчёты</span>
          <div className="app-topbar__actions">
            <button onClick={() => setCurrentScreen('profile')}>👤 Профиль</button>
            <button onClick={() => setCurrentScreen('admin')}>🛡️ Админ</button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>
        </div>
        <Reports />
      </div>
    );
  }

  // ========== Ошибка ==========
  if (currentScreen === 'error') {
    return <Error code={404} onGoHome={() => setCurrentScreen('projects')} />;
  }

  // ========== Проекты ==========
  if (currentScreen === 'projects') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
        <div className="app-topbar">
          <span className="app-topbar__user">👤 {currentUser}</span>
          <div className="app-topbar__actions">
            <button onClick={() => setCurrentScreen('calendar')}>📅 Календарь</button>
            <button onClick={() => setCurrentScreen('reports')}>📊 Отчёты</button>
            <button onClick={() => setCurrentScreen('profile')}>👤 Профиль</button>
            <button onClick={() => setCurrentScreen('admin')}>🛡️ Админ</button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>
        </div>
        <Projects 
          onSelectProject={handleSelectProject} 
          onCreateProject={() => setCurrentScreen('setup')}
        />
      </div>
    );
  }

  // ========== Создание проекта ==========
  if (currentScreen === 'setup') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
        <ProjectSetup onProjectCreated={handleProjectCreated} />
      </div>
    );
  }

  // ========== Доска ==========
  if (currentScreen === 'board') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
        <div className="app-topbar">
          <button className="app-topbar__back" onClick={() => setCurrentScreen('projects')}>←</button>
          <span className="app-topbar__project">📋 {projectName || 'Проект'}</span>
          <span className="app-topbar__theme">{projectTheme}</span>
          <div className="app-topbar__actions">
            <button onClick={() => setCurrentScreen('calendar')}>📅 Календарь</button>
            <button onClick={() => setCurrentScreen('reports')}>📊 Отчёты</button>
            <button onClick={() => setCurrentScreen('profile')}>👤 Профиль</button>
            <button onClick={() => setCurrentScreen('admin')}>🛡️ Админ</button>
            <button onClick={handleLogout}>🚪 Выйти</button>
          </div>
        </div>
        <Board pageId={1} />
      </div>
    );
  }

  // ========== Профиль ==========
  if (currentScreen === 'profile') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
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

  // ========== Админка ==========
  if (currentScreen === 'admin') {
    return (
      <div className="app">
        {api.isMockMode && <div className="mock-badge">🧪 МОК-РЕЖИМ</div>}
        {api.isMockMode && (
          <div style={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            background: '#212529',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 12,
            zIndex: 9999,
            opacity: 0.8,
            maxWidth: 260,
            textAlign: 'center'
          }}>
            🧪 МОК-РЕЖИМ<br/>
            <span style={{ fontSize: 10, opacity: 0.7 }}>
              Страницы с 🧪 — заглушки
            </span>
          </div>
        )}
        <Admin onBack={() => setCurrentScreen('projects')} />
      </div>
    );
  }

  return null;
}

export default App;