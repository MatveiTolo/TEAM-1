import './Reports.css';

export const Reports = () => {
  return (
    <div className="reports-container">
      <div className="placeholder">
        <div className="placeholder__icon">📊</div>
        <h2 className="placeholder__title">Ежедневные отчёты</h2>
        <p className="placeholder__desc">
          Здесь будут отчёты по задачам, которые приходят в Telegram каждое утро.
          <br />
          <span style={{ color: '#adb5bd', fontSize: '13px' }}>
            Пока что это заглушка — скоро появится реальная статистика!
          </span>
        </p>
        <div className="placeholder__badge">🧪 ЗАГЛУШКА</div>
        <div style={{ marginTop: 20, fontSize: 13, color: '#6c757d' }}>
          📌 Для разработчиков: страница <code style={{ background: '#f1f3f5', padding: '2px 8px', borderRadius: 4 }}>/reports</code>
        </div>
      </div>
    </div>
  );
};