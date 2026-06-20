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
      <div className="error-card">
        <div className="error-code">{code}</div>
        <h1 className="error-title">{titles[code]}</h1>
        <p className="error-message">{message || defaultMessages[code]}</p>
        <button className="error-btn" onClick={onGoHome}>
          На главную
        </button>
      </div>
    </div>
  );
};