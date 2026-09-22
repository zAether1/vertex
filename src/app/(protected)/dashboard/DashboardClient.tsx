'use client';

/**
 * Vertex — Panel principal del estudiante
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import {
  Zap, TrendingUp, ShoppingBag, Award, Gift, Target,
  Gamepad2, ArrowUpRight, ArrowDownRight, Clock, Star,
} from 'lucide-react';
import { dashboard as t } from '@/lib/i18n/es';

interface PointAccount {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalReceived: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  reason: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const [points, setPoints] = useState<PointAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pointsRes, historyRes] = await Promise.all([
          fetch('/api/points'),
          fetch('/api/points/history?limit=5'),
        ]);
        if (pointsRes.ok) setPoints(await pointsRes.json());
        if (historyRes.ok) {
          const data = await historyRes.json();
          setTransactions(data.transactions || []);
        }
      } catch {
        // Error fetching data
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const initAnimations = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;

        if (statsRef.current) {
          gsap.fromTo(statsRef.current.children, { opacity: 0, y: 20, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
        }
        if (feedRef.current) {
          const items = feedRef.current.querySelectorAll(`.${styles.feedItem}`);
          gsap.fromTo(items, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.3 });
        }
        if (points && statsRef.current) {
          const balanceEl = statsRef.current.querySelector('[data-counter="balance"]');
          if (balanceEl) {
            const target = points.balance;
            const obj = { val: 0 };
            gsap.to(obj, {
              val: target, duration: 1.5, ease: 'power2.out', delay: 0.2,
              onUpdate: () => { balanceEl.textContent = Math.round(obj.val).toLocaleString('es-EC'); },
            });
          }
        }
      } catch {}
    };
    initAnimations();
  }, [loading, points]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t.justNow;
    if (minutes < 60) return t.minutesAgo(minutes);
    if (hours < 24) return t.hoursAgo(hours);
    if (days < 7) return t.daysAgo(days);
    return date.toLocaleDateString('es-EC', { month: 'short', day: 'numeric' });
  };

  const getTransactionIcon = (type: string) => {
    if (['EARN', 'ADMIN_GRANT', 'MISSION_REWARD', 'ACTIVITY_REWARD', 'BONUS', 'CODE_REDEEM', 'GAME_REWARD'].includes(type)) {
      return { icon: ArrowUpRight, className: styles.feedIconEarn };
    }
    if (['GAME_LOSS'].includes(type)) {
      return { icon: Gamepad2, className: styles.feedIconGame };
    }
    return { icon: ArrowDownRight, className: styles.feedIconSpend };
  };

  const fmt = (n: number) => (n ?? 0).toLocaleString('es-EC');

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>{t.greeting}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>

      <div className={styles.statsGrid} ref={statsRef}>
        <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
          <div className={`${styles.statIconWrap} ${styles.statIconPrimary}`}><Zap size={20} /></div>
          <div className={styles.statLabel}>{t.balance}</div>
          <div className={`${styles.statValue} ${styles.statValuePrimary}`} data-counter="balance">
            {loading ? '—' : fmt(points?.balance ?? 0)}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}><TrendingUp size={20} /></div>
          <div className={styles.statLabel}>{t.totalEarned}</div>
          <div className={styles.statValue}>{loading ? '—' : fmt(points?.totalEarned ?? 0)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconYellow}`}><ShoppingBag size={20} /></div>
          <div className={styles.statLabel}>{t.totalSpent}</div>
          <div className={styles.statValue}>{loading ? '—' : fmt(points?.totalSpent ?? 0)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrap} ${styles.statIconCyan}`}><Award size={20} /></div>
          <div className={styles.statLabel}>{t.received}</div>
          <div className={styles.statValue}>{loading ? '—' : fmt(points?.totalReceived ?? 0)}</div>
        </div>
      </div>

      <div className={styles.quickActions}>
        <Link href="/rewards" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.statIconPrimary}`}><Gift size={20} /></div>
          <div><div className={styles.quickActionLabel}>{t.rewardsStore}</div><div className={styles.quickActionDesc}>{t.rewardsStoreDesc}</div></div>
        </Link>
        <Link href="/missions" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.statIconCyan}`}><Target size={20} /></div>
          <div><div className={styles.quickActionLabel}>{t.missionsLabel}</div><div className={styles.quickActionDesc}>{t.missionsDesc}</div></div>
        </Link>
        <Link href="/arcade" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.statIconGreen}`}><Gamepad2 size={20} /></div>
          <div><div className={styles.quickActionLabel}>{t.arcadeLabel}</div><div className={styles.quickActionDesc}>{t.arcadeDesc}</div></div>
        </Link>
        <Link href="/leaderboard" className={styles.quickAction}>
          <div className={`${styles.quickActionIcon} ${styles.statIconYellow}`}><Star size={20} /></div>
          <div><div className={styles.quickActionLabel}>{t.leaderboardLabel}</div><div className={styles.quickActionDesc}>{t.leaderboardDesc}</div></div>
        </Link>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.recentActivity}</h2>
            <Link href="/profile" className={styles.sectionLink}>{t.viewAll}</Link>
          </div>
          <div className={styles.sectionBody} ref={feedRef}>
            {loading ? (
              <div className={styles.feedList}>
                {[...Array(4)].map((_, i) => <div key={i} className={`${styles.feedItem} skeleton`} style={{ height: 48 }} />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <Clock className={styles.emptyIcon} />
                <div className={styles.emptyTitle}>{t.noActivity}</div>
                <div className={styles.emptyDesc}>{t.noActivityDesc}</div>
              </div>
            ) : (
              <div className={styles.feedList}>
                {transactions.map((tx) => {
                  const { icon: Icon, className: iconClass } = getTransactionIcon(tx.type);
                  return (
                    <div key={tx.id} className={styles.feedItem}>
                      <div className={`${styles.feedIcon} ${iconClass}`}><Icon size={16} /></div>
                      <div className={styles.feedContent}>
                        <div className={styles.feedTitle}>{tx.reason || tx.type.replace(/_/g, ' ').toLowerCase()}</div>
                        <div className={styles.feedTime}>{formatDate(tx.createdAt)}</div>
                      </div>
                      <div className={`${styles.feedAmount} ${tx.amount >= 0 ? styles.feedAmountPositive : styles.feedAmountNegative}`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('es-EC')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.activeMissions}</h2>
            <Link href="/missions" className={styles.sectionLink}>{t.viewAll}</Link>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.emptyState}>
              <Target className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>{t.missionsLoading}</div>
              <div className={styles.emptyDesc}>{t.missionsLoadingDesc}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
