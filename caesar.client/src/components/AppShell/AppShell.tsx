import type { ReactNode } from 'react';
import './AppShell.css';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface AppShellProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
  active?: string;
  children: ReactNode;
  /** Hide the full nav (e.g. on focused flows like project setup). */
  minimalNav?: boolean;
}

const icon = (path: ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const NAV: NavItem[] = [
  { id: 'projects', label: 'Проекты',  icon: icon(<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>) },
  { id: 'calendar', label: 'Календарь', icon: icon(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>) },
  { id: 'reports',  label: 'Отчёты',   icon: icon(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>) },
  { id: 'profile',  label: 'Профиль',  icon: icon(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>) },
  { id: 'admin',    label: 'Админ',    icon: icon(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>) },
];

export const AppShell = ({
  title, subtitle, onBack, onNavigate, onLogout, active,
  children, minimalNav = false,
}: AppShellProps) => {
  return (
    <div className="shell caesar-scope">
      <div className="caesar-bg" />

      <header className="shell-topbar">
        <div className="shell-topbar__left">
          {onBack && (
            <button className="shell-back" onClick={onBack} aria-label="Назад">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <img
            src="/attachments/Ориг Ц.png"
            alt="CAESAR"
            className="shell-logo"
            onClick={() => onNavigate('projects')}
          />
          {title && (
            <div className="shell-titleblock">
              <span className="shell-title">{title}</span>
              {subtitle && <span className="shell-subtitle">{subtitle}</span>}
            </div>
          )}
        </div>

        {!minimalNav && (
          <nav className="shell-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`shell-nav__btn${active === item.id ? ' is-active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.icon}
                <span className="shell-nav__label">{item.label}</span>
              </button>
            ))}
            <button className="shell-nav__btn shell-nav__btn--logout" onClick={onLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="shell-nav__label">Выйти</span>
            </button>
          </nav>
        )}
      </header>

      <main className="shell-content">{children}</main>
    </div>
  );
};