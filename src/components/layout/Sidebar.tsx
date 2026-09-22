'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import {
  LayoutDashboard, Gift, Target, Trophy, Gamepad2,
  Menu
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rewards', label: 'Recompensas', icon: Gift },
  { href: '/missions', label: 'Misiones', icon: Target },
  { href: '/achievements', label: 'Logros', icon: Trophy },
  { href: '/arcade', label: 'Arcade', icon: Gamepad2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isExtended, setIsExtended] = useState(false);

  return (
    <aside
      className={`${styles.sidebar} ${isExtended ? styles.sidebarExtended : ''}`}
      onMouseEnter={() => setIsExtended(true)}
      onMouseLeave={() => setIsExtended(false)}
    >
      <div className={styles.nav}>
        <button 
          className={styles.navItem} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 12px' }}
          onClick={() => setIsExtended(!isExtended)}
        >
          <Menu className={styles.icon} />
          <span className={styles.label}>Menú</span>
        </button>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <item.icon className={styles.icon} />
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
