import { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import './Register.css';

interface RegisterProps {
  onRegister: (username: string) => void;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export const Register = ({ onRegister, onBack, onNavigate }: RegisterProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const api = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Отправка регистрации:', { username, email, password: '***' });
      
      const result = await api.register(username, email, password);
      console.log('✅ Результат регистрации:', result);

      try {
        await api.login(email, password);
        onRegister(username);
      } catch (loginErr) {
        console.error('Ошибка входа после регистрации:', loginErr);
        onRegister(username);
      }
    } catch (err: any) {
      console.error('❌ Ошибка регистрации:', err);
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background"></div>

      {/* Топ-бар полностью идентичен лендингу */}
      <div className="register-topbar">
        <button className="register-topbar__back" onClick={() => onNavigate?.('landing')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Назад</span>
        </button>
        <div className="register-topbar__logo">
          <img src="/attachments/Ориг Ц.png" alt="CAESAR" className="register-topbar__logo-img" />
        </div>
      </div>

      <div className="register-main">
        <div className="register-grid">
          
          <div className="register-form-wrapper">
            <div className="register-card">
              <div className="register-card__header">
                <h2 className="register-card__title">Регистрация</h2>
                <p className="register-card__subtitle">Создайте доступ к Caesar</p>
              </div>

              <form onSubmit={handleSubmit} className="register-form">
                {error && <div className="register-error">{error}</div>}

                <div className="register-field">
                  <label className="register-field__label">Имя пользователя</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ваше имя"
                    className="register-field__input"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="register-field">
                  <label className="register-field__label">Электронная почта</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@caesar.com"
                    className="register-field__input"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="register-field">
                  <label className="register-field__label">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Минимум 6 символов"
                    className="register-field__input"
                    disabled={loading}
                    required
                  />
                </div>

                <button type="submit" className="register-submit" disabled={loading}>
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </form>
            </div>
          </div>

          <div className="register-image">
            <div className="register-image__wrapper">
              <img 
                src="/attachments/Регистрация.jpg" 
                alt="Скульптор" 
                className="register-image__img" 
              />
            </div>
          </div>

        </div>
      </div>

      <div className="register-footer">
        <span className="register-footer__text">Уже есть аккаунт? </span>
        <button className="register-footer__btn" onClick={onBack}>
          Войти
        </button>
      </div>
    </div>
  );
};