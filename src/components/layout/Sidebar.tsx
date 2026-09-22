'use client';

/**
 * Vertex â€” Barra lateral de navegaciÃ³n
 */

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './Sidebar.module.css';
import {
  LayoutDashboard, Gift, Target, Trophy, Gamepad2,
  BarChart3, User, Settings, LogOut, Zap, Menu, X, Gem,
} from 'lucide-react';
import { nav } from '@/lib/i18n/es';

const NAV_SECTIONS = [
  {
    label: nav.main,
    items: [
      { href: '/dashboard', label: nav.dashboard, icon: LayoutDashboard },
      { href: '/rewards', label: nav.rewards, icon: Gift },
      { href: '/missions', label: nav.missions, icon: Target },
      { href: '/achievements', label: nav.achievements, icon: Trophy },
    ],
  },
  {
    label: nav.play,
    items: [
      { href: '/arcade', label: nav.arcade, icon: Gamepad2 },
    ],
  },
  {
    label: nav.community,
    items: [
      { href: '/leaderboard', label: nav.leaderboard, icon: BarChart3 },
    ],
  },
  {
    label: nav.account,
    items: [
      { href: '/profile', label: nav.profile, icon: User },
      { href: '/settings', label: nav.settings, icon: Settings },
    ],
  },
];

interface SidebarProps {
  username?: string;
  avatarUrl?: string | null;
  balance?: number;
}

export default function Sidebar({ username = 'Usuario', avatarUrl, balance = 0 }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => { const tId = setTimeout(() => setMobileOpen(false), 0); return () => clearTimeout(tId); }, [pathname]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  useEffect(() => {
    const initGsap = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        if (sidebarRef.current) {
          const items = sidebarRef.current.querySelectorAll(`.${styles.navItem}`);
          gsap.fromTo(items, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, ease: 'power2.out', delay: 0.2 });
        }
      } catch {}
    };
    initGsap();
  }, []);

  const formatBalance = (val: number) => val.toLocaleString('es-EC');

  return (
    <>
      <button
        className={styles.mobileMenuBtn}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Cerrar menÃº' : 'Abrir menÃº'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayVisible : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}
        role="navigation"
        aria-label="NavegaciÃ³n principal"
      >
        <div className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.logo}>
            <div className={styles.logoIcon}><Gem size={20} /></div>
            <div>
              <div className={styles.logoText}>Vertex</div>
              <div className={styles.logoTagline}>Recompensas</div>
            </div>
          </Link>
        </div>

        <nav className={styles.nav}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.label}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={styles.navIcon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {avatarUrl ? <img src={avatarUrl} alt="" /> : username.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{username}</div>
              <div className={styles.userBalance}>
                <Zap size={12} />
                {formatBalance(balance)} pts
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

