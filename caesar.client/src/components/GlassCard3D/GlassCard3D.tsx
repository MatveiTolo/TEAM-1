import { useState } from 'react';
import './GlassCard3D.css';

export const GlassCard3D = () => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;
    setInputValue('');
    // Здесь будет вызов вашего AI в будущем
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="glass-chat-wrapper">
      <div className="glass-chat-overlay">
        
        {/* ИИ-ядро: ожидание запроса пользователя */}
        <div className="glass-chat__placeholder">
          <div className="ai-core" aria-hidden="true">
            {/* Орбиты с частицами */}
            <div className="ai-core__orbit ai-core__orbit--1">
              <span className="ai-core__particle"></span>
            </div>
            <div className="ai-core__orbit ai-core__orbit--2">
              <span className="ai-core__particle"></span>
            </div>
            <div className="ai-core__orbit ai-core__orbit--3">
              <span className="ai-core__particle"></span>
            </div>

            {/* Пульсирующие кольца */}
            <span className="ai-core__ring"></span>
            <span className="ai-core__ring ai-core__ring--delay"></span>

            {/* Нейросетевое ядро */}
            <svg className="ai-core__brain" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="24" cy="24" r="4" className="ai-core__node ai-core__node--center" />
              <circle cx="11" cy="15" r="2.4" className="ai-core__node" />
              <circle cx="37" cy="14" r="2.4" className="ai-core__node" />
              <circle cx="12" cy="34" r="2.4" className="ai-core__node" />
              <circle cx="36" cy="35" r="2.4" className="ai-core__node" />
              <path d="M13 16 L22 22 M35 15 L26 22 M14 33 L22 26 M34 34 L26 26" className="ai-core__synapse" />
            </svg>

            {/* Луч-сканер */}
            <span className="ai-core__scan"></span>
          </div>

          <div className="glass-chat__status">
            <span className="glass-chat__dots">
              <span></span><span></span><span></span>
            </span>
            <p className="glass-chat__hint">Ожидание запроса...</p>
          </div>
        </div>

        {/* Поле ввода */}
        <div className="glass-chat__input-wrapper">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите запрос для ИИ..." 
            className="glass-chat__input"
          />
          <button 
            onClick={handleSend}
            className="glass-chat__send-btn"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
};