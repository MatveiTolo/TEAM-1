import './Invite.css';

interface InviteProps {
  onAccept: () => void;
  onReject: () => void;
}

export const Invite = ({ onAccept, onReject }: InviteProps) => {
  return (
    <div className="invite-container">
      <div className="invite-card">
        <div className="invite-icon">📩</div>
        <h1 className="invite-title">Приглашение в проект</h1>
        <p className="invite-description">
          Вас пригласили присоединиться к проекту <strong>«Название проекта»</strong>
        </p>
        <p className="invite-role">Вы будете добавлены как: <strong>Разработчик</strong></p>
        <div className="invite-buttons">
          <button className="invite-btn secondary" onClick={onReject}>
            Отклонить
          </button>
          <button className="invite-btn primary" onClick={onAccept}>
            Принять приглашение
          </button>
        </div>
      </div>
    </div>
  );
};