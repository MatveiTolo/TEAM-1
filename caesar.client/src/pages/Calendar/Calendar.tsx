import './Calendar.css';

export const Calendar = () => {
  return (
    <div className="calendar-container">
      <div className="placeholder">
        <div className="placeholder__icon">📅</div>
        <h2 className="placeholder__title">Умный календарь</h2>
        <p className="placeholder__desc">
          Здесь будут отображаться все задачи с дедлайнами в виде сетки.
          <br />
          <span style={{ color: '#adb5bd', fontSize: '13px' }}>
            Пока что это заглушка — скоро появится реальный календарь!
          </span>
        </p>
        <div className="placeholder__badge">🧪 ЗАГЛУШКА</div>
        <div style={{ marginTop: 20, fontSize: 13, color: '#6c757d' }}>
          📌 Для разработчиков: страница <code style={{ background: '#f1f3f5', padding: '2px 8px', borderRadius: 4 }}>/calendar</code>
        </div>
      </div>
    </div>
  );
};