'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import { useRole } from '@/hooks/useRole';
import { BrandMark } from '@/components/Brand/BrandMark';
import { Icon } from '@/components/Icon/Icon';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Início', icon: 'grid-dashboard-bento' },
  { href: '/pages', label: 'Páginas', icon: 'file-default' },
  { href: '/experiments', label: 'Testes A/B', icon: 'lab-flask-round' },
  { href: '/analytics', label: 'Analytics', icon: 'barchart-default' },
];

const themeConfig = {
  light: { icon: 'sun', label: 'Modo claro' },
  dark: { icon: 'moon', label: 'Modo escuro' },
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useRole();

  const allNavItems = isAdmin
    ? [...navItems, { href: '/settings', label: 'Configurações', icon: 'settings-gear' }]
    : navItems;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const userAvatar: string | undefined = user?.user_metadata?.avatar_url;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark size={24} />
      </div>

      <nav className={styles.nav}>
        {allNavItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>
              <Icon name={item.icon} size={20} />
            </span>
            <span className={styles.tooltip}>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.themeBtn}>
          <AnimatedThemeToggler isDark={theme === 'dark'} onToggle={toggleTheme} />
          <span className={styles.tooltip}>{themeConfig[theme].label}</span>
        </div>
        <button className={styles.userBtn} onClick={signOut} title="Sair">
          {userAvatar ? (
            <img src={userAvatar} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
          ) : (
            <span className={styles.avatarFallback}>{userInitial}</span>
          )}
          <span className={styles.tooltip}>Sair</span>
        </button>
      </div>
    </aside>
  );
}
