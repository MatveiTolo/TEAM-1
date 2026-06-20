import './UserProfile.css';

interface UserProfileProps {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    projectsCount: number;
  };
  onLogout: () => void;
  onBack: () => void;
}

// Мок-данные пользователя
const MOCK_USER = {
  id: 1,
  username: 'Иван Петров',
  email: 'ivan@example.com',
  role: 'Главный администратор',
  createdAt: '01.01.2026',
  projectsCount: 4,
};

export const UserProfile = ({ onLogout, onBack }: UserProfileProps) => {
  const user = MOCK_USER;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <button className="profile-back" onClick={onBack}>← Назад</button>
        
        <div className="profile-avatar">
          <span className="profile-avatar__emoji">👤</span>
        </div>

        <h1 className="profile-name">{user.username}</h1>
        <p className="profile-role">{user.role}</p>

        <div className="profile-info">
          <div className="profile-info__item">
            <span className="profile-info__label">Email</span>
            <span className="profile-info__value">{user.email}</span>
          </div>
          <div className="profile-info__item">
            <span className="profile-info__label">Дата регистрации</span>
            <span className="profile-info__value">{user.createdAt}</span>
          </div>
          <div className="profile-info__item">
            <span className="profile-info__label">Проектов</span>
            <span className="profile-info__value">{user.projectsCount}</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="profile-btn profile-btn--primary">
            ✏️ Редактировать профиль
          </button>
          <button className="profile-btn profile-btn--danger" onClick={onLogout}>
            🚪 Выйти
          </button>
        </div>
      </div>
    </div>
  );
};