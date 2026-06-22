import './Landing.css';

interface LandingProps {
  onNavigate: (page: string) => void;
}

const CARDS = [
  { color: 'red', statue: 'Красный Ц.png', card: 'Красная карточка.png', line: 'Красная чёрточка.png', icon: 'Иконка DB.png' },
  { color: 'yellow', statue: 'Жёлтый Ц.png', card: 'Жёлтая карточка.png', line: 'Жёлтая чёрточка.png', icon: 'Иконка WiFi.png' },
  { color: 'green', statue: 'Зелёный Ц.png', card: 'Зелёная карточка.png', line: 'Зелёная чёрточка.png', icon: 'Иконка Знаки.png' },
  { color: 'blue', statue: 'Лазурный Ц.png', card: 'Лазурная карточка.png', line: 'Лазурная чёрточка.png', icon: 'Иконка Чип.png' },
  { color: 'purple', statue: 'Фиолетовый Ц.png', card: 'Фиолетовая карточка.png', line: 'Фиолетовая чёрточка.png', icon: 'Иконка бесконечность.png' },
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
          <button className="landing-nav__btn" onClick={() => onNavigate('login')}>
            Вход
          </button>
          <button className="landing-nav__btn" onClick={() => onNavigate('register')}>
            Регистрация
          </button>
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
          
          {/* СТАТУИ И КАРТОЧКИ */}
          <div className="landing-cards">
            {CARDS.map((item) => (
              <div key={item.color} className="landing-card-group">
                <img 
                  src={`/attachments/${item.statue}`} 
                  alt="" 
                  className="landing-card-group__statue" 
                />
                <div className={`landing-card-group__container landing-card-group__container--${item.color}`}>
                  <img src={`/attachments/${item.card}`} alt="" className="landing-card-group__card-bg" />
                  <img src={`/attachments/${item.line}`} alt="" className="landing-card-group__line" />
                  <div className="landing-card-group__bottom">
                    <img src={`/attachments/${item.icon}`} alt="" className="landing-card-group__icon" />
                    <img src={`/attachments/${item.line}`} alt="" className="landing-card-group__short-line" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ПОЛЕ ДЛЯ ОБЩЕНИЯ */}
          <div className="landing-chat">
            <div>
              <p className="landing-chat__title">Поле для общения с Caesar</p>
              <p className="landing-chat__hint">Напишите свой запрос здесь...</p>
            </div>
          </div>
        </div>
      </div>

      {/* НИЖНИЕ СЕКЦИИ */}
      <div className="landing-sections">
        <div className="landing-sections__inner">
          
          {/* ПРЕИМУЩЕСТВА */}
          <div className="landing-features">
            {[
              { icon: 'fa-database', title: 'База данных', desc: 'Встроенная поддержка SQL и NoSQL.' },
              { icon: 'fa-wifi', title: 'Синхронизация', desc: 'Код и настройки всегда с вами.' },
              { icon: 'fa-code', title: 'Умный автокод', desc: 'ИИ-ассистент ускоряет написание кода.' },
            ].map((item, idx) => (
              <div key={idx} className="landing-features__card">
                <i className={`fas ${item.icon} landing-features__icon`}></i>
                <h3 className="landing-features__title">{item.title}</h3>
                <p className="landing-features__desc">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* ОКНО С КОДОМ */}
          <div className="landing-code">
            <div className="landing-code__left">
              <h2 className="landing-code__title">Ваш рабочий процесс</h2>
              <p className="landing-code__desc">Все инструменты под рукой: от отладчика до терминала.</p>
              <ul className="landing-code__list">
                <li><i className="fas fa-circle-check landing-code__check"></i> Встроенный Git и CI/CD</li>
                <li><i className="fas fa-circle-check landing-code__check"></i> Профилировщик</li>
                <li><i className="fas fa-circle-check landing-code__check"></i> Тема "Мрамор"</li>
              </ul>
            </div>
            <div className="landing-code__right">
              <div className="landing-code__window">
                <pre>
                  <span className="landing-code__keyword">def</span> <span className="landing-code__function">caesar_cipher</span>(text, shift):
                  <span className="landing-code__result">result</span> = <span className="landing-code__string">""</span>
                  <span className="landing-code__keyword">for</span> char <span className="landing-code__keyword">in</span> text:
                  <span className="landing-code__keyword">if</span> char.isalpha():
                  <span className="landing-code__shifted">shifted</span> = chr((ord(char) - <span className="landing-code__number">65</span> + shift) % <span className="landing-code__number">26</span> + <span className="landing-code__number">65</span>)
                  result += shifted
                  <span className="landing-code__keyword">else</span>:
                  result += char
                  <span className="landing-code__keyword">return</span> result
                </pre>
              </div>
            </div>
          </div>

          {/* ДЛЯ КОМАНД */}
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

      {/* ПОДВАЛ */}
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