import './Landing.css';
import { GlassCard3D } from '../../components/GlassCard3D/GlassCard3D';
import { ThreeDCard } from '../../components/GlassCard3D/ThreeDCard';

interface LandingProps {
  onNavigate: (page: string) => void;
}

const CARDS = [
  { id: 'red', combo: 'combo-red.png', color: '#ff4d4d' },
  { id: 'yellow', combo: 'combo-yellow.png', color: '#ffd700' },
  { id: 'green', combo: 'combo-green.png', color: '#22c55e' },
  { id: 'blue', combo: 'combo-blue.png', color: '#0ea5e9' },
  { id: 'purple', combo: 'combo-purple.png', color: '#a855f7' },
];

export const Landing = ({ onNavigate }: LandingProps) => {
  return (
    <div className="landing-page">
      {/* НАВИГАЦИЯ */}
      <nav className="landing-nav">
        <div className="landing-nav__logo">
          <img src="/attachments/Ориг Ц.png" alt="CAESAR" className="landing-nav__logo-img" />
        </div>
        <div className="landing-nav__links">
          <button className="landing-nav__link">Продукты</button>
          <button className="landing-nav__link">Решения</button>
          <button className="landing-nav__link">Цены</button>
        </div>
        <div className="landing-nav__actions">
          <span className="landing-nav__user">Пользователь</span>
          <button className="landing-nav__btn" onClick={() => onNavigate('login')}>Вход</button>
          <button className="landing-nav__btn" onClick={() => onNavigate('register')}>Регистрация</button>
        </div>
      </nav>

      {/* ГЕРОЙ */}
      <div className="landing-hero">
        <div className="landing-hero__content">
          <h1 className="landing-hero__title">Caesar</h1>
        </div>
        <div className="landing-hero__overlay"></div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <div className="landing-main">
        <div className="landing-main__inner">
          
          {/* ЦЕЗАРИ (подняты на 2px: -62 → -64) */}
          <div className="landing-cards-wrapper">
            <div className="landing-cards">
              {CARDS.map((item) => (
                <div key={item.id} className="landing-card-group">
                  <img 
                    src={`/attachments/${item.combo}`} 
                    alt="" 
                    className="landing-card-group__combo" 
                    style={{ marginTop: '-64px' }} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* БЕГУЩИЙ МЕАНДР */}
          <div className="neon-frieze neon-show">
            <div className="neon-frieze__fade-container">
              <div className="neon-frieze__top-line"></div>
              <div className="neon-frieze__track">
                <div className="neon-frieze__scroller">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <svg key={`a-${i}`} viewBox="0 0 80 80" width="80" height="80" className="neon-frieze__svg" preserveAspectRatio="xMidYMid meet">
                      <path d="M 10 10 L 70 10 L 70 70 L 10 70 L 10 30 L 50 30 L 50 50 L 30 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter" />
                    </svg>
                  ))}
                  {Array.from({ length: 14 }).map((_, i) => (
                    <svg key={`b-${i}`} viewBox="0 0 80 80" width="80" height="80" className="neon-frieze__svg" preserveAspectRatio="xMidYMid meet">
                      <path d="M 10 10 L 70 10 L 70 70 L 10 70 L 10 30 L 50 30 L 50 50 L 30 50" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="neon-frieze__bottom-line"></div>
            </div>
            <div className="neon-frieze__vignette"></div>
          </div>

        </div>
      </div>

      {/* СЕКЦИЯ С ЧАТОМ И 3D */}
      <div className="landing-3d-section">
        <div className="landing-3d-section__inner">
          
          <div className="landing-chat-wrapper">
            {/* ФОН ЗА КАРТОЧКОЙ (ForAIChat.jpg) - аккуратно под стеклом */}
            <div className="chat-bg-wrapper">
              <div className="chat-bg-container"></div>
            </div>
            
            {/* Стеклянный чат */}
            <GlassCard3D />
          </div>

          <div className="three-d-grid">
            <ThreeDCard 
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              }
              title="Храним всё, что важно"
              desc="Задачи, сроки, исполнители и история каждого изменения — в одной надёжной базе."
            />

            <ThreeDCard 
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <line x1="12" y1="20" x2="12.01" y2="20"></line>
                </svg>
              }
              title="Работайте откуда угодно"
              desc="Доска, задачи и Telegram-уведомления синхронизируются в реальном времени."
            />

            <ThreeDCard 
              icon={
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              }
              title="Контроль без лишних кликов"
              desc="Цветная подсветка сроков, автоматические отчёты в Telegram и чёткая колоночная система. Всё работает само — вы просто двигаете задачи."
            />
          </div>

        </div>
      </div>

      {/* ОСТАЛЬНЫЕ СЕКЦИИ */}
      <div className="landing-sections">
        <div className="landing-sections__inner">
          <div className="landing-code">
            <div className="landing-code__left">
              <h2 className="landing-code__title">Путь к вашей первой доске</h2>
              <p className="landing-code__desc">
                Вам стоит только пожелать, а мы поможем с реализацией. 
                Всего 5 простых шагов — и вы уже управляете проектами в CAESAR.
              </p>
              <ul className="landing-code__list">
                <li><i className="fas fa-circle-check landing-code__check"></i> Интуитивный интерфейс без лишних окон</li>
                <li><i className="fas fa-circle-check landing-code__check"></i> Мгновенный переход от идеи к работе</li>
                <li><i className="fas fa-circle-check landing-code__check"></i> Никакого программирования — только управление</li>
              </ul>
            </div>
            <div className="landing-code__right">
              <div className="landing-code__window">
                <pre>
<span className="landing-code__comment"># Путь пользователя в CAESAR</span>

<span className="landing-code__number">1.</span> <span className="landing-code__keyword">РЕГИСТРАЦИЯ</span>
   → Создайте аккаунт за 30 секунд
   → Подтвердите Email
   → Готово к работе!

<span className="landing-code__number">2.</span> <span className="landing-code__keyword">ВХОД В СИСТЕМУ</span>
   → Введите логин и пароль
   → (Опционально) Вход через Telegram
   → Мгновенный доступ к личному кабинету

<span className="landing-code__number">3.</span> <span className="landing-code__keyword">СПИСОК ВАШИХ ДОСОК</span>
   → Обзор всех активных проектов
   → Сортировка по дате, статусу, участникам
   → <span className="landing-code__string">Нажмите на доску, чтобы открыть</span>

<span className="landing-code__number">4.</span> <span className="landing-code__keyword">СОЗДАТЬ НОВЫЙ ПРОЕКТ</span>
   → Нажмите кнопку <span className="landing-code__string">«Создать проект»</span>
   → Введите название проекта
   → Выберите шаблон (IT / Маркетинг / Дизайн)
   → Готово! Доска создана.
                </pre>
              </div>
            </div>
          </div>

          <div className="landing-team">
            <div className="landing-team__header">
              <h2 className="landing-team__title">Для вашей команды</h2>
              <p className="landing-team__subtitle">Совместная работа, контроль версий.</p>
            </div>
            <div className="landing-team__grid">
              {[
                { number: '24/7', title: 'Доступность' },
                { number: '∞', title: 'Масштабирование' },
                { number: '🔒', title: 'Безопасность' },
              ].map((item, idx) => (
                <div key={idx} className="landing-team__card">
                  <div className="landing-team__number">{item.number}</div>
                  <h4 className="landing-team__card-title">{item.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <span className="landing-footer__copy">© 2026 Caesar.</span>
          <div className="landing-footer__links">
            <a href="#" className="landing-footer__link">Конфиденциальность</a>
            <a href="#" className="landing-footer__link">Условия</a>
            <a href="#" className="landing-footer__link">Поддержка</a>
          </div>
        </div>
      </footer>
    </div>
  );
};