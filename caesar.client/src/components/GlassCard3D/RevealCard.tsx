import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface RevealCardProps {
  imageSrc: string;
  alt?: string;
  delay?: number;
}

export const RevealCard = ({ imageSrc, alt = "Statue", delay = 0 }: RevealCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" }); // Срабатывает, когда до блока остается 100px

  return (
    <div ref={ref} className="reveal-card-wrapper">
      {/* Верхняя часть: Цезарь (всегда виден) */}
      <div className="reveal-card__top">
        <img src={imageSrc} alt={alt} className="reveal-card__image" />
      </div>

      {/* Нижняя часть: Карточка (выезжает при скролле) */}
      <motion.div 
        className="reveal-card__bottom"
        initial={{ height: 0, opacity: 0 }}
        animate={isInView ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ 
          duration: 0.8, 
          delay: delay,
          ease: [0.16, 1, 0.3, 1] // Эффект пружинки
        }}
      >
        <img src={imageSrc} alt={alt} className="reveal-card__image" />
      </motion.div>
    </div>
  );
};