import { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
  isRegistering?: boolean;
}

export const Login = ({ onLogin, isRegistering = false }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(isRegistering);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      await api.login(username, password);
      onLogin(username);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (username: string) => {
    try {
      await api.login(username, 'password');
      onLogin(username);
    } catch {
      onLogin(username);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">🏛️ CAESAR</div>
        <h1 className="login-title">{isRegisterMode ? 'Создать аккаунт' : 'Войти'}</h1>
        
        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите имя"
              className="login-input"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="login-input"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Загрузка...' : (isRegisterMode ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>

        <div className="login-footer">
          <button 
            className="login-switch"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
          >
            {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>
        </div>

        <div className="login-mock">
          <p>🧪 Быстрый вход (для тестирования)</p>
          <button className="mock-btn" onClick={() => quickLogin('admin')}>
            Войти как admin
          </button>
          <button className="mock-btn" onClick={() => quickLogin('developer')}>
            Войти как developer
          </button>
          <button className="mock-btn" onClick={() => quickLogin('tester')}>
            Войти как tester
          </button>
          <button className="mock-btn" onClick={() => quickLogin('viewer')}>
            Войти как viewer
          </button>
        </div>
      </div>
    </div>
  );
};