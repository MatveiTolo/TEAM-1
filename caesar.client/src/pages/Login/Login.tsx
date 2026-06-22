import { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
  onNavigate?: (page: string) => void;
}

export const Login = ({ onLogin, onNavigate }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="login-page">
      <div className="login-background"></div>

      {/* ВЕРХНЯЯ ПАНЕЛЬ С КНОПКОЙ НАЗАД */}
      <div className="login-topbar">
        <button className="login-topbar__back" onClick={() => onNavigate?.('landing')}>
          ← Назад
        </button>
        <div className="login-topbar__logo">
          <img src="/attachments/Ориг Ц.png" alt="CAESAR" className="login-topbar__logo-img" />
        </div>
      </div>

      <div className="login-container">
        <div className="login-grid">
          
          {/* ЛЕВАЯ ЧАСТЬ — ЛОГОТИП */}
          <div className="login-brand">
            <div className="login-brand__content">
              <img src="/attachments/Ориг Ц.png" alt="CAESAR" className="login-brand__logo" />
              <h1 className="login-brand__title">Caesar</h1>
              <p className="login-brand__subtitle">Ваше виртуальное пространство</p>
            </div>
          </div>

          {/* ПРАВАЯ ЧАСТЬ — ФОРМА */}
          <div className="login-form-wrapper">
            
            {/* Мобильный логотип */}
            <div className="login-mobile-logo">
              <img src="/attachments/Ориг Ц.png" alt="CAESAR" className="login-mobile-logo__img" />
              <h1 className="login-mobile-logo__title">Caesar</h1>
              <p className="login-mobile-logo__subtitle">Вход в виртуальную доску</p>
            </div>

            <div className="login-card">
              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="login-error">{error}</div>}

                <div className="login-field">
                  <label className="login-field__label">Email или логин</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="user@caesar.com"
                    className="login-field__input"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="login-field">
                  <label className="login-field__label">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-field__input"
                    disabled={loading}
                    required
                  />
                </div>

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'Загрузка...' : 'Войти'}
                </button>
              </form>

              <div className="login-forgot">
                <a href="#" className="login-forgot__link">Забыли пароль?</a>
              </div>
            </div>
          </div>

        </div>

        {/* ССЫЛКА НА РЕГИСТРАЦИЮ ВНИЗУ */}
        <div className="login-footer-link">
          <span className="login-footer-link__text">Нет аккаунта? </span>
          <button 
            className="login-footer-link__btn"
            onClick={() => onNavigate?.('register')}
          >
            Зарегистрироваться
          </button>
        </div>

        {/* БЫСТРЫЙ ВХОД */}
        <div className="login-mock">
          <p className="login-mock__label">🧪 Быстрый вход (для тестирования)</p>
          <div className="login-mock__buttons">
            <button className="login-mock__btn" onClick={() => quickLogin('admin')}>admin</button>
            <button className="login-mock__btn" onClick={() => quickLogin('developer')}>developer</button>
            <button className="login-mock__btn" onClick={() => quickLogin('tester')}>tester</button>
            <button className="login-mock__btn" onClick={() => quickLogin('viewer')}>viewer</button>
          </div>
        </div>
      </div>
    </div>
  );
};