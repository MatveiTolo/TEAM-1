import './Error.css';

interface ErrorProps {
  code?: 403 | 404;
  message?: string;
  onGoHome: () => void;
}

export const Error = ({ code = 404, message, onGoHome }: ErrorProps) => {
  const defaultMessages = {
    403: 'У вас нет доступа к этой странице.',
    404: 'Страница не найдена.'
  };

  const titles = {
    403: 'Доступ запрещён',
    404: 'Страница не найдена'
  };

  return (
    <div className="error-container">
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#0d6efd', lineHeight: 1, marginBottom: 8 }}>
          {code}
        </div>
        <h2 style={{ marginBottom: 8 }}>{titles[code]}</h2>
        <p style={{ color: '#6c757d', marginBottom: 24 }}>
          {message || defaultMessages[code]}
        </p>
        <button className="btn-primary" onClick={onGoHome}>На главную</button>
        <div style={{ marginTop: 24, fontSize: 13, color: '#adb5bd' }}>
          🧪 ЗАГЛУШКА — страница ошибки
        </div>
      </div>
    </div>
  );
};