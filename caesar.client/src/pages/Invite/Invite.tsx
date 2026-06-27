import './Invite.css';

interface InviteProps {
  onAccept: () => void;
  onReject: () => void;
  projectName?: string;
  role?: string;
}

export const Invite = ({ onAccept, onReject, projectName = 'Название проекта', role = 'Разработчик' }: InviteProps) => {
  return (
    <div className="invite-page caesar-scope">
      <div className="caesar-bg" />
      <div className="invite-card">
        <div className="invite-icon">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 className="invite-title">Приглашение в проект</h1>
        <p className="invite-text">
          Вас пригласили присоединиться к проекту <strong>«{projectName}»</strong>
        </p>
        <div className="invite-role">
          <span className="invite-role__label">Ваша роль</span>
          <span className="invite-role__value">{role}</span>
        </div>
        <div className="invite-actions">
          <button className="caesar-btn caesar-btn--ghost" onClick={onReject}>Отклонить</button>
          <button className="caesar-btn caesar-btn--primary" onClick={onAccept}>Принять приглашение</button>
        </div>
      </div>
    </div>
  );
};
