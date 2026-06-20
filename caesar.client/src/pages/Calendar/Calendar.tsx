import './Calendar.css';

export const Calendar = () => {
  return (
    <div className="calendar-container">
      <div className="calendar-placeholder">
        <div className="calendar-icon">📅</div>
        <h2>Умный календарь</h2>
        <p>Скоро здесь появятся все задачи с дедлайнами в виде сетки.</p>
        <p className="calendar-hint">Пока что можно посмотреть на пустую заглушку 👀</p>
      </div>
    </div>
  );
};