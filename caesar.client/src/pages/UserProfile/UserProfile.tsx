import { useState } from 'react';
import { useApi } from '../../context/ApiContext';
import { Icon } from '../../components/Icon/Icon';
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
}

export const UserProfile = ({ user, onLogout }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const api = useApi();

  const handleSave = async () => {
    setError('');
    setSuccess('');
    
    if (!username.trim() || !email.trim()) {
      setError('Все поля обязательны');
      return;
    }

    try {
      setLoading(true);
      await api.updateProfile({ userName: username, email });
      setSuccess('Профиль успешно обновлён');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar">
          <span className="profile-avatar__emoji"><Icon name="user" size={40} /></span>
        </div>

        {!isEditing ? (
          <>
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
              <button 
                className="profile-btn profile-btn--primary" 
                onClick={() => setIsEditing(true)}
              >
                <Icon name="edit" size={16} /> Редактировать профиль
              </button>
              <button className="profile-btn profile-btn--danger" onClick={onLogout}>
                <Icon name="logout" size={16} /> Выйти
              </button>
            </div>
          </>
        ) : (
          <div className="profile-edit">
            <h2 className="profile-edit__title">Редактирование профиля</h2>
            
            {error && <div className="profile-edit__error">{error}</div>}
            {success && <div className="profile-edit__success">{success}</div>}

            <div className="profile-edit__field">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="profile-edit__field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="profile-edit__actions">
              <button 
                className="profile-btn profile-btn--secondary" 
                onClick={() => {
                  setIsEditing(false);
                  setUsername(user.username);
                  setEmail(user.email);
                  setError('');
                  setSuccess('');
                }}
                disabled={loading}
              >
                Отмена
              </button>
              <button 
                className="profile-btn profile-btn--primary" 
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};