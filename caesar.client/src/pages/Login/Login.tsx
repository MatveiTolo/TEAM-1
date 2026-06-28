import { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
  onNavigate?: (page: string) => void;
}

export const Login = ({ onLogin, onNavigate }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      console.log('Отправка запроса на вход:', { email });
      
      const response = await api.login(email, password);
      console.log('Ответ от сервера:', response);
      
      // ====== ВАЖНО: Сохраняем токен! ======
      if (response.token) {
        localStorage.setItem('caesar_token', response.token);
        console.log('Токен сохранен в localStorage');
      } else {
        console.warn('Токен отсутствует в ответе сервера');
        setError('Ошибка: токен не получен от сервера');
        return;
      }
      
      // Проверяем, что токен сохранился
      const token = localStorage.getItem('caesar_token');
      console.log('Токен в localStorage:', token ? 'присутствует' : 'отсутствует');
      
      // Получаем имя пользователя из ответа
      const username = response.username || response.userName || email.split('@')[0] || 'Пользователь';
      
      // Вызываем onLogin для перехода на страницу проектов
      onLogin(username);
      
    } catch (err: any) {
      console.error('Ошибка входа:', err);
      
      if (err.response) {
        console.error('Детали ошибки:', {
          status: err.response.status,
          data: err.response.data,
        });
        setError(err.response.data?.message || err.response.data?.title || `Ошибка ${err.response.status}`);
      } else if (err.request) {
        setError('Сервер не отвечает. Проверьте подключение.');
      } else {
        setError(err.message || 'Ошибка входа');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background"></div>

      <div className="login-topbar">
        <button className="login-topbar__back" onClick={() => onNavigate?.('landing')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Назад</span>
        </button>
        <div className="login-topbar__logo">
          <img src="/attachments/Ориг Ц.png" alt="CAESAR" className="login-topbar__logo-img" />
        </div>
      </div>

      <div className="login-main">
        <div className="login-grid">
          
          <div className="login-form-wrapper">
            <div className="login-card">
              <div className="login-card__header">
                <div className="login-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
                <h2 className="login-card__title">Вход</h2>
                <p className="login-card__subtitle">Добро пожаловать обратно в Caesar</p>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                {error && <div className="login-error">{error}</div>}

                <div className="login-field">
                  <label className="login-field__label">Электронная почта</label>
                  <div className="login-field__wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@caesar.com"
                      className="login-field__input"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-field__label">Пароль</label>
                  <div className="login-field__wrapper">
                    <span className="login-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
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
                </div>

                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? (
                    <span className="login-submit__loader"></span>
                  ) : (
                    'Войти'
                  )}
                </button>
              </form>

              <div className="login-forgot">
                <a href="#" className="login-forgot__link">Забыли пароль?</a>
              </div>
            </div>
          </div>

          <div className="login-image">
            <div className="login-image__wrapper">
              <div className="login-image__glow"></div>
              <img 
                src="/attachments/ФонСвет.png" 
                alt="Лучи света" 
                className="login-image__img" 
              />
            </div>
          </div>

        </div>
      </div>

      <div className="login-footer">
        <span className="login-footer__text">Нет аккаунта? </span>
        <button 
          className="login-footer__btn" 
          onClick={() => onNavigate?.('register')}
        >
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
};