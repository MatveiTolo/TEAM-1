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
        
        {/* Заглушка для будущего ИИ (пустое пространство) */}
        <div className="glass-chat__placeholder">
          <div className="glass-chat__indicator"></div>
          <p className="glass-chat__hint">Ожидание запроса...</p>
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