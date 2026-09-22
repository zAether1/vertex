'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Zap, 
  TrendingUp, 
  ShoppingBag, 
  Award, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Gamepad2, 
  Target,
  Gift,
  Star,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { dashboard as t } from '@/lib/i18n/es';
import styles from './Dashboard.module.css';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface DashboardData {
  user: {
    name: string;
    level: number;
    xp: number;
  };
  stats: {
    balance: number;
    completedMissions: number;
    availableMissions: number;
    rank: string | number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentActivity: any[];
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const statsRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Error al cargar dashboard');
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError('No se pudo cargar la informaciÃ³n');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (loading || !statsRef.current || !feedRef.current || !data) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;

        gsap.fromTo(
          statsRef.current!.children, 
          { opacity: 0, scale: 0.95, y: 15 }, 
          { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'back.out(1.2)' }
        );

        if (feedRef.current && feedRef.current.children.length > 0) {
          gsap.fromTo(
            feedRef.current.children,
            { opacity: 0, x: -10 },
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
          );
        }
      } catch {}
    };
    init();
  }, [loading, data]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Justo ahora';
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

  if (error) {
    return (
      <div className={styles.dashboard}>
        <Card>
          <CardContent style={{ padding: '48px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 16px' }} />
            <h2>{error}</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.greeting}>{data ? `Â¡Hola, ${data.user.name}!` : t.greeting}</h1>
        <p className={styles.subtitle}>
          {data ? `Nivel ${data.user.level} â€¢ ${fmt(data.user.xp)} XP` : t.subtitle}
        </p>
      </div>

      <div className={styles.statsGrid} ref={statsRef}>
        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIconWrap} ${styles.statIconPrimary}`}>
              <Zap size={20} />
            </div>
            <div className={styles.statLabel}>{t.balance}</div>
          </div>
          <div className={`${styles.statValue} ${styles.statValuePrimary}`} data-counter="balance">
            {loading ? '-' : fmt(data?.stats.balance ?? 0)}
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIconWrap} ${styles.statIconGreen}`}>
              <CheckCircle size={20} />
            </div>
            <div className={styles.statLabel}>Misiones</div>
          </div>
          <div className={styles.statValue}>
            {loading ? '-' : `${fmt(data?.stats.completedMissions ?? 0)} / ${fmt((data?.stats.completedMissions ?? 0) + (data?.stats.availableMissions ?? 0))}`}
          </div>
        </Card>

        <Card className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIconWrap} ${styles.statIconYellow}`}>
              <Star size={20} />
            </div>
            <div className={styles.statLabel}>Rango</div>
          </div>
          <div className={styles.statValue}>
            {loading ? '-' : data?.stats.rank}
          </div>
        </Card>
      </div>

      <div className={styles.quickActions}>
        <Link href="/rewards" style={{ textDecoration: 'none' }}>
          <Card className={styles.quickAction} style={{ padding: '16px', flexDirection: 'row' }}>
            <div className={`${styles.quickActionIcon} ${styles.statIconPrimary}`}>
              <Gift size={20} />
            </div>
            <div>
              <div className={styles.quickActionLabel}>{t.rewardsStore}</div>
              <div className={styles.quickActionDesc}>{t.rewardsStoreDesc}</div>
            </div>
          </Card>
        </Link>
        <Link href="/missions" style={{ textDecoration: 'none' }}>
          <Card className={styles.quickAction} style={{ padding: '16px', flexDirection: 'row' }}>
            <div className={`${styles.quickActionIcon} ${styles.statIconCyan}`}>
              <Target size={20} />
            </div>
            <div>
              <div className={styles.quickActionLabel}>{t.missionsLabel}</div>
              <div className={styles.quickActionDesc}>{t.missionsDesc}</div>
            </div>
          </Card>
        </Link>
        <Link href="/arcade" style={{ textDecoration: 'none' }}>
          <Card className={styles.quickAction} style={{ padding: '16px', flexDirection: 'row' }}>
            <div className={`${styles.quickActionIcon} ${styles.statIconGreen}`}>
              <Gamepad2 size={20} />
            </div>
            <div>
              <div className={styles.quickActionLabel}>{t.arcadeLabel}</div>
              <div className={styles.quickActionDesc}>{t.arcadeDesc}</div>
            </div>
          </Card>
        </Link>
        <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
          <Card className={styles.quickAction} style={{ padding: '16px', flexDirection: 'row' }}>
            <div className={`${styles.quickActionIcon} ${styles.statIconYellow}`}>
              <Star size={20} />
            </div>
            <div>
              <div className={styles.quickActionLabel}>{t.leaderboardLabel}</div>
              <div className={styles.quickActionDesc}>{t.leaderboardDesc}</div>
            </div>
          </Card>
        </Link>
      </div>

      <div className={styles.contentGrid}>
        <Card>
          <CardHeader style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <CardTitle>{t.recentActivity}</CardTitle>
            <Link href="/profile" className={styles.sectionLink}>{t.viewAll}</Link>
          </CardHeader>
          <CardContent>
            <div ref={feedRef}>
              {loading ? (
                <div className={styles.feedList}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`${styles.feedItem} skeleton`} style={{ height: 48 }} />
                  ))}
                </div>
              ) : !data?.recentActivity || data.recentActivity.length === 0 ? (
                <div className={styles.emptyState}>
                  <Clock className={styles.emptyIcon} />
                  <div className={styles.emptyTitle}>{t.noActivity}</div>
                  <div className={styles.emptyDesc}>{t.noActivityDesc}</div>
                </div>
              ) : (
                <div className={styles.feedList}>
                  {data.recentActivity.map((tx) => {
                    const { icon: Icon, className: iconClass } = getTransactionIcon(tx.type);
                    return (
                      <div key={tx.id} className={styles.feedItem}>
                        <div className={`${styles.feedIcon} ${iconClass}`}>
                          <Icon size={16} />
                        </div>
                        <div className={styles.feedContent}>
                          <div className={styles.feedTitle}>
                            {tx.description || tx.type.replace(/_/g, ' ').toLowerCase()}
                          </div>
                          <div className={styles.feedTime}>{formatDate(tx.date)}</div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





