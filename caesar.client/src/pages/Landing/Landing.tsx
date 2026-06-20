import './Landing.css';

interface LandingProps {
  onNavigate: (page: string) => void;
}

export const Landing = ({ onNavigate }: LandingProps) => {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="landing-title">🏛️ CAESAR</h1>
        <p className="landing-subtitle">
          Управляй проектами. Следи за задачами. Получай уведомления в Telegram.
        </p>
        <div className="landing-buttons">
          <button className="btn-primary" onClick={() => onNavigate('login')} style={{ fontSize: 16, padding: '14px 48px' }}>
            Войти
          </button>
          <button className="btn-secondary" onClick={() => onNavigate('register')} style={{ fontSize: 16, padding: '14px 48px' }}>
            Зарегистрироваться
          </button>
        </div>
        <div className="landing-features">
          <span>📋 Доска</span>
          <span>📅 Календарь</span>
          <span>📊 Отчёты</span>
          <span>👥 Роли</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: '#adb5bd' }}>
          🧪 Демо-версия — все данные моковые
        </div>
      </div>
    </div>
  );
};