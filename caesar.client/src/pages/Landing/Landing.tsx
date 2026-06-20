import './Landing.css';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export const Landing = ({ onNavigate }: LandingProps) => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">🏛️ CAESAR</h1>
        <p className="landing-subtitle">Управляй проектами. Следи за задачами. Получай уведомления в Telegram.</p>
        <div className="landing-buttons">
          <button className="landing-btn primary" onClick={() => onNavigate('login')}>
            Войти
          </button>
          <button className="landing-btn secondary" onClick={() => onNavigate('register')}>
            Зарегистрироваться
          </button>
        </div>
        <div className="landing-features">
          <span>📋 Доска задач</span>
          <span>📅 Умный календарь</span>
          <span>📊 Отчёты в Telegram</span>
          <span>👥 Роли и права</span>
        </div>
      </div>
    </div>
  );
};