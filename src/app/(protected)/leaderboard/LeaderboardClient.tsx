'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Crown, AlertCircle } from 'lucide-react';
import { leaderboard as t } from '@/lib/i18n/es';
import styles from './Leaderboard.module.css';
import { Card, CardContent } from '@/components/ui';

interface LeaderboardUser {
  id: string;
  username: string;
  displayAlias: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
}

export default function LeaderboardClient() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Error al cargar la tabla de líderes');
        const json = await res.json();
        setLeaders(json.data || []);
      } catch (err) {
        setError('No se pudo cargar la tabla de líderes');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaders();
  }, []);

  useEffect(() => {
    if (loading || !listRef.current || leaders.length === 0) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(
          listRef.current!.children, 
          { opacity: 0, x: -20 }, 
          { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' }
        );
      } catch {}
    };
    init();
  }, [loading, leaders]);

  const getRankClass = (i: number) => {
    if (i === 0) return styles.rank1;
    if (i === 1) return styles.rank2;
    if (i === 2) return styles.rank3;
    return '';
  };
  
  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown size={24} />;
    if (i <= 2) return <Medal size={24} />;
    return `#${i + 1}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.trophyWrap}>
          <Trophy size={32} />
        </div>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>
      
      {loading ? (
        <div className={styles.list}>
          {[...Array(5)].map((_, i) => (
            <Card key={i} className={`skeleton ${styles.itemCard}`} style={{ height: 74 }} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 12px' }} />
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : leaders.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Trophy size={48} color="var(--color-gray-300)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>El salón de la fama está vacío</h3>
            <p style={{ color: 'var(--color-gray-200)', fontSize: '14px' }}>Sé el primero en ganar puntos y aparecer aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.list} ref={listRef}>
          {leaders.map((leader, index) => (
            <Card 
              key={leader.id} 
              className={styles.itemCard}
            >
              <div className={`${styles.rank} ${getRankClass(index)}`}>
                {getRankIcon(index)}
              </div>
              <div className={styles.avatar}>
                {leader.avatarUrl ? <img src={leader.avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} /> : (leader.displayAlias || leader.username).charAt(0).toUpperCase()}
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{leader.displayAlias || leader.username} <span style={{fontSize: '11px', color: 'var(--color-gray-200)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px'}}>Nv. {leader.level}</span></div>
              </div>
              <div className={styles.score}>
                {leader.xp.toLocaleString('es-EC')} XP
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
