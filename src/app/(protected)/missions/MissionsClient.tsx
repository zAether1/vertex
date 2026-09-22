'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, Zap, CheckCircle } from 'lucide-react';
import { missions as t } from '@/lib/i18n/es';

const s = {
  page: { padding: 'var(--space-6)' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-6)' } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-5)' } as React.CSSProperties,
  card: { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', transition: 'all 0.25s' } as React.CSSProperties,
  cardHeader: { display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' } as React.CSSProperties,
  iconWrap: { width: 48, height: 48, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'var(--color-accent-secondary-subtle)', color: 'var(--color-accent-secondary)' } as React.CSSProperties,
  info: { flex: 1, minWidth: 0 } as React.CSSProperties,
  name: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '2px' } as React.CSSProperties,
  desc: { fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-2)' } as React.CSSProperties,
  reward: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent-primary)', background: 'var(--color-accent-primary-subtle)', padding: '2px 8px', borderRadius: 'var(--radius-full)' } as React.CSSProperties,
  progressSection: { marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-primary)' } as React.CSSProperties,
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', fontWeight: 500 } as React.CSSProperties,
  progressBar: { height: 6, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' } as React.CSSProperties,
  progressFill: { height: '100%', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-full)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' } as React.CSSProperties,
};

interface Mission {
  id: string; name: string; description: string | null; reward: number; targetValue: number; currentValue: number; isCompleted: boolean;
}

export default function MissionsClient() {
  const [missionsList, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMissions([
      { id: '1', name: 'Primer inicio de sesión', description: 'Inicia sesión en la plataforma por primera vez.', reward: 100, targetValue: 1, currentValue: 1, isCompleted: true },
      { id: '2', name: 'Jugador', description: 'Juega 5 partidas en el Arcade.', reward: 500, targetValue: 5, currentValue: 2, isCompleted: false },
      { id: '3', name: 'Coleccionista', description: 'Canjea cualquier recompensa de la tienda.', reward: 1000, targetValue: 1, currentValue: 0, isCompleted: false },
    ]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(gridRef.current!.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
      } catch {}
    };
    init();
  }, [loading]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>{t.title}</h1>
        <p style={s.subtitle}>{t.subtitle}</p>
      </div>
      {loading ? (
        <div style={s.grid}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ ...s.card, height: 160 }} />)}</div>
      ) : (
        <div style={s.grid} ref={gridRef}>
          {missionsList.map(mission => (
            <div key={mission.id} style={{ ...s.card, borderColor: mission.isCompleted ? 'var(--color-success)' : 'var(--color-border-primary)' }}>
              <div style={s.cardHeader}>
                <div style={{ ...s.iconWrap, background: mission.isCompleted ? 'var(--color-success-subtle)' : 'var(--color-accent-secondary-subtle)', color: mission.isCompleted ? 'var(--color-success)' : 'var(--color-accent-secondary)' }}>
                  {mission.isCompleted ? <CheckCircle size={24} /> : <Target size={24} />}
                </div>
                <div style={s.info}>
                  <div style={s.name}>{mission.name}</div>
                  <div style={s.desc}>{mission.description}</div>
                  <div style={{ ...s.reward, ...(mission.isCompleted ? { background: 'var(--color-success-subtle)', color: 'var(--color-success)' } : {}) }}>
                    <Zap size={12} /> {mission.reward} pts
                  </div>
                </div>
              </div>
              <div style={s.progressSection}>
                <div style={s.progressLabels}>
                  <span>{t.progress}</span>
                  <span>{mission.currentValue} / {mission.targetValue}</span>
                </div>
                <div style={s.progressBar}>
                  <div style={{ ...s.progressFill, width: `${Math.min(100, (mission.currentValue / mission.targetValue) * 100)}%`, ...(mission.isCompleted ? { background: 'var(--color-success)' } : {}) }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
