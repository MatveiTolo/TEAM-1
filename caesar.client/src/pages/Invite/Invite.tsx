import './Invite.css';

interface InviteProps {
  onAccept: () => void;
  onReject: () => void;
}

export const Invite = ({ onAccept, onReject }: InviteProps) => {
  return (
    <div className="invite-container">
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📩</div>
        <h2 style={{ marginBottom: 8 }}>Приглашение в проект</h2>
        <p style={{ color: '#6c757d', marginBottom: 8 }}>
          Вас пригласили присоединиться к проекту <strong>«Название проекта»</strong>
        </p>
        <p style={{ fontSize: 14, color: '#495057', marginBottom: 32 }}>
          Вы будете добавлены как: <strong>Разработчик</strong>
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn-secondary" onClick={onReject}>Отклонить</button>
          <button className="btn-primary" onClick={onAccept}>Принять</button>
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: '#adb5bd' }}>
          🧪 ЗАГЛУШКА — страница приглашения
        </div>
      </div>
    </div>
  );
};