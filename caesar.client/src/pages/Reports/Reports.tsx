import './Reports.css';

export const Reports = () => {
  return (
    <div className="reports-container">
      <div className="reports-placeholder">
        <div className="reports-icon">📊</div>
        <h2>Ежедневные отчёты</h2>
        <p>Скоро здесь будут отчёты по задачам, которые приходят в Telegram каждое утро.</p>
        <div className="reports-mock">
          <div className="reports-mock-item">
            <span>📌 Создано задач:</span>
            <strong>12</strong>
          </div>
          <div className="reports-mock-item">
            <span>✅ Закрыто задач:</span>
            <strong>8</strong>
          </div>
          <div className="reports-mock-item">
            <span>⚠️ Просрочено:</span>
            <strong>3</strong>
          </div>
        </div>
      </div>
    </div>
  );
};