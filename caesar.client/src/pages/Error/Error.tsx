import './Error.css';

interface ErrorProps {
  code?: 403 | 404 | 500;
  message?: string;
  onGoHome: () => void;
}

const TITLES: Record<number, string> = {
  403: 'Доступ запрещён',
  404: 'Страница не найдена',
  500: 'Что-то пошло не так',
};

const MESSAGES: Record<number, string> = {
  403: 'У вас нет прав для просмотра этой страницы.',
  404: 'Такой страницы не существует или она была перемещена.',
  500: 'Произошла ошибка на сервере. Попробуйте позже.',
};

export const Error = ({ code = 404, message, onGoHome }: ErrorProps) => {
  return (
    <div className="error-page caesar-scope">
      <div className="caesar-bg" />
      <div className="error-card">
        <div className="error-code">{code}</div>
        <h1 className="error-title">{TITLES[code]}</h1>
        <p className="error-text">{message || MESSAGES[code]}</p>
        <button className="caesar-btn caesar-btn--primary" onClick={onGoHome}>
          Вернуться на главную
        </button>
      </div>
    </div>
  );
};
