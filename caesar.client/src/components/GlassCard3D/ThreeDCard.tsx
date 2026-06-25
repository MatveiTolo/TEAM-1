import { useState } from 'react';

interface ThreeDCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: number;
}

export const ThreeDCard = ({ icon, title, desc, delay = 0 }: ThreeDCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleMouseEnter = () => setIsFlipped(true);
  const handleMouseLeave = () => setIsFlipped(false);

  return (
    <div 
      className="three-d-card-wrapper"
      style={{ 
        animationDelay: `${delay}s`,
        opacity: 0,
        animation: `fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s forwards`
      }}
    >
      <div 
        className={`three-d-card-inner ${isFlipped ? 'three-d-card-inner--flipped' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* ПЕРЕДНЯЯ СТОРОНА (Иконка + Заголовок) */}
        <div className="three-d-card-front">
          <div className="three-d-card__icon-wrapper">
            {icon}
          </div>
          <h3 className="three-d-card__title">{title}</h3>
        </div>

        {/* ЗАДНЯЯ СТОРОНА (Описание) */}
        <div className="three-d-card-back">
          <p className="three-d-card__desc">{desc}</p>
        </div>
      </div>
    </div>
  );
};