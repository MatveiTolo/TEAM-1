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
  const [consent, setConsent] = useState(false);
  const [isConsentOpen, setIsConsentOpen] = useState(false);

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

    if (!consent) {
      setError('Необходимо согласие на обработку персональных данных');
      return;
    }

    try {
      setLoading(true);
      console.log('Отправка регистрации:', { username, email, password: '***' });
      
      const result = await api.register(username, email, password);
      console.log('Результат регистрации:', result);

      try {
        await api.login(email, password);
        onRegister(username);
      } catch (loginErr) {
        console.error('Ошибка входа после регистрации:', loginErr);
        onRegister(username);
      }
    } catch (err: any) {
      console.error('Ошибка регистрации:', err);
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-background"></div>

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
                <div className="register-card__icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <h2 className="register-card__title">Регистрация</h2>
                <p className="register-card__subtitle">Создайте доступ к Caesar</p>
              </div>

              <form onSubmit={handleSubmit} className="register-form">
                {error && <div className="register-error">{error}</div>}

                <div className="register-field">
                  <label className="register-field__label">Имя пользователя</label>
                  <div className="register-field__wrapper">
                    <span className="register-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
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
                </div>

                <div className="register-field">
                  <label className="register-field__label">Электронная почта</label>
                  <div className="register-field__wrapper">
                    <span className="register-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
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
                </div>

                <div className="register-field">
                  <label className="register-field__label">Пароль</label>
                  <div className="register-field__wrapper">
                    <span className="register-field__icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
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
                </div>

                <label className="register-consent">
                  <input
                    type="checkbox"
                    className="register-consent__checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="register-consent__box" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="register-consent__text">
                    Я ознакомлен(а) и согласен(на) с{' '}
                    <button
                      type="button"
                      className="register-consent__link"
                      onClick={(e) => { e.preventDefault(); setIsConsentOpen(true); }}
                    >
                      обработкой персональных данных
                    </button>
                  </span>
                </label>

                <button type="submit" className="register-submit" disabled={loading || !consent}>
                  {loading ? (
                    <span className="register-submit__loader"></span>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="register-image">
            <div className="register-image__wrapper">
              <div className="register-image__glow"></div>
              <img 
                src="/attachments/Скульптор.png" 
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

      {isConsentOpen && (
        <div
          className="consent-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-modal-title"
          onClick={() => setIsConsentOpen(false)}
        >
          <div className="consent-modal__card" onClick={(e) => e.stopPropagation()}>
            <button
              className="consent-modal__close"
              onClick={() => setIsConsentOpen(false)}
              aria-label="Закрыть"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="consent-modal__header">
              <span className="consent-modal__badge">152-ФЗ</span>
              <h3 className="consent-modal__title" id="consent-modal-title">
                Согласие на обработку персональных данных
              </h3>
              <p className="consent-modal__subtitle">
                В соответствии с Федеральным законом № 152-ФЗ «О персональных данных»
              </p>
            </div>

            <div className="consent-modal__body">
              <p>
                Регистрируясь в сервисе CAESAR, вы даёте оператору согласие на обработку
                ваших персональных данных (имя пользователя и адрес электронной почты),
                указанных при создании аккаунта.
              </p>
              <p>Обработка данных осуществляется в следующих целях:</p>
              <ul>
                <li>создание и идентификация вашей учётной записи;</li>
                <li>обеспечение доступа к функциям сервиса и сохранение ваших проектов;</li>
                <li>направление сервисных уведомлений, связанных с работой сервиса.</li>
              </ul>
              <p>
                Под обработкой понимаются сбор, запись, систематизация, хранение,
                уточнение, использование, блокирование, удаление и уничтожение
                персональных данных. Обработка ведётся как автоматизированным,
                так и неавтоматизированным способом.
              </p>
              <p>
                Согласие действует с момента регистрации и до момента его отзыва.
                Вы вправе в любой момент отозвать согласие, направив запрос оператору,
                а также потребовать удаления своих данных. Оператор не передаёт ваши
                данные третьим лицам, за исключением случаев, предусмотренных
                законодательством Российской Федерации.
              </p>
              <p className="consent-modal__note">
                Нажимая «Зарегистрироваться», вы подтверждаете, что ознакомились с
                настоящим текстом, а ваше согласие является конкретным, информированным
                и сознательным.
              </p>
            </div>

            <div className="consent-modal__footer">
              <button
                className="consent-modal__btn consent-modal__btn--ghost"
                onClick={() => setIsConsentOpen(false)}
              >
                Закрыть
              </button>
              <button
                className="consent-modal__btn consent-modal__btn--accent"
                onClick={() => { setConsent(true); setIsConsentOpen(false); setError(''); }}
              >
                Прочитал(а) и согласен(на)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};