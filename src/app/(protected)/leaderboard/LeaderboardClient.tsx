'use client';

import { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Crown } from 'lucide-react';
import { leaderboard as t } from '@/lib/i18n/es';

const s = {
  page: { padding: 'var(--space-6)', maxWidth: 800, margin: '0 auto' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-8)', textAlign: 'center' as const } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  list: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-3)' } as React.CSSProperties,
  item: { display: 'flex', alignItems: 'center', padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', gap: 'var(--space-4)', transition: 'transform 0.2s, box-shadow 0.2s' } as React.CSSProperties,
  rank: { width: 40, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-muted)', textAlign: 'center' as const } as React.CSSProperties,
  rank1: { color: 'var(--color-warning)' },
  rank2: { color: '#94a3b8' },
  rank3: { color: '#b45309' },
  avatar: { width: 40, height: 40, borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden' } as React.CSSProperties,
  info: { flex: 1 } as React.CSSProperties,
  name: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)' } as React.CSSProperties,
  score: { fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-accent-primary)', fontFamily: 'var(--font-display)' } as React.CSSProperties,
};

export default function LeaderboardClient() {
  const [leaders, setLeaders] = useState<{ id: string; alias: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLeaders([
      { id: '1', alias: 'ShadowNinja', score: 14500 },
      { id: '2', alias: 'CyberPunk', score: 12200 },
      { id: '3', alias: 'PixelKing', score: 11050 },
      { id: '4', alias: 'NeonRider', score: 9800 },
      { id: '5', alias: 'StarDust', score: 8400 },
      { id: '6', alias: 'GhostProtocol', score: 7200 },
      { id: '7', alias: 'ZeroCool', score: 6500 },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || !listRef.current) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(listRef.current!.children, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out' });
      } catch {}
    };
    init();
  }, [loading]);

  const getRankStyle = (i: number) => i === 0 ? s.rank1 : i === 1 ? s.rank2 : i === 2 ? s.rank3 : {};
  const getRankIcon = (i: number) => {
    if (i === 0) return <Crown size={24} />;
    if (i <= 2) return <Medal size={24} />;
    return `#${i + 1}`;
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'var(--color-warning-subtle)', color: 'var(--color-warning)', marginBottom: 'var(--space-4)' }}>
          <Trophy size={32} />
        </div>
        <h1 style={s.title}>{t.title}</h1>
        <p style={s.subtitle}>{t.subtitle}</p>
      </div>
      {loading ? (
        <div style={s.list}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ ...s.item, height: 74 }} />)}</div>
      ) : (
        <div style={s.list} ref={listRef}>
          {leaders.map((leader, index) => (
            <div key={leader.id} style={s.item}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--color-border-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--color-border-primary)'; }}
            >
              <div style={{ ...s.rank, ...getRankStyle(index) }}>{getRankIcon(index)}</div>
              <div style={s.avatar}>{leader.alias.charAt(0).toUpperCase()}</div>
              <div style={s.info}><div style={s.name}>{leader.alias}</div></div>
              <div style={s.score}>{leader.score.toLocaleString('es-EC')} {t.pts}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
