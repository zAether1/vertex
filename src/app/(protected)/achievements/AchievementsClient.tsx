'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Medal, Star } from 'lucide-react';
import { achievements as t } from '@/lib/i18n/es';

const s = {
  page: { padding: 'var(--space-6)' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-6)' } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' } as React.CSSProperties,
  card: { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', transition: 'all 0.25s', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', textAlign: 'center' as const } as React.CSSProperties,
  iconWrap: { width: 64, height: 64, borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)', position: 'relative' as const } as React.CSSProperties,
  name: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' } as React.CSSProperties,
  desc: { fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', lineHeight: 'var(--leading-relaxed)' } as React.CSSProperties,
  lockedCard: { opacity: 0.6, filter: 'grayscale(1)' } as React.CSSProperties,
  lockedIcon: { position: 'absolute' as const, bottom: -4, right: -4, background: 'var(--color-bg-surface)', borderRadius: '50%', padding: 4, color: 'var(--color-text-muted)', border: '2px solid var(--color-bg-secondary)' } as React.CSSProperties,
  rarityBadge: { fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', textTransform: 'uppercase' as const, letterSpacing: 'var(--tracking-wide)', marginTop: 'var(--space-3)' } as React.CSSProperties,
};

const RARITY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  COMMON: { bg: 'var(--color-bg-tertiary)', text: 'var(--color-text-secondary)', icon: 'var(--color-text-muted)' },
  UNCOMMON: { bg: 'var(--color-success-subtle)', text: 'var(--color-success)', icon: 'var(--color-success)' },
  RARE: { bg: 'var(--color-info-subtle)', text: 'var(--color-info)', icon: 'var(--color-info)' },
  EPIC: { bg: 'var(--color-accent-primary-subtle)', text: 'var(--color-accent-primary)', icon: 'var(--color-accent-primary)' },
  LEGENDARY: { bg: 'var(--color-warning-subtle)', text: 'var(--color-warning)', icon: 'var(--color-warning)' },
};

interface Achievement {
  id: string; name: string; description: string; rarity: string; unlockedAt: Date | null;
}

export default function AchievementsClient() {
  const [achievementsList, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAchievements([
      { id: '1', name: 'Primeros pasos', description: 'Completa tu primera misión.', rarity: 'COMMON', unlockedAt: new Date() },
      { id: '2', name: 'Racha ganadora', description: 'Gana 5 veces seguidas en el Arcade.', rarity: 'RARE', unlockedAt: new Date() },
      { id: '3', name: 'Comprador frecuente', description: 'Canjea 10 recompensas de la tienda.', rarity: 'EPIC', unlockedAt: null },
      { id: '4', name: 'Millonario', description: 'Acumula 1.000.000 de puntos.', rarity: 'LEGENDARY', unlockedAt: null },
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
        gsap.fromTo(gridRef.current!.children, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.5)' });
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
        <div style={s.grid}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ ...s.card, height: 200 }} />)}</div>
      ) : (
        <div style={s.grid} ref={gridRef}>
          {achievementsList.map(a => {
            const isUnlocked = !!a.unlockedAt;
            const colors = RARITY_COLORS[a.rarity] || RARITY_COLORS.COMMON;
            return (
              <div key={a.id} style={{ ...s.card, ...(!isUnlocked ? s.lockedCard : {}) }}>
                <div style={{ ...s.iconWrap, background: colors.bg, color: colors.icon }}>
                  {a.rarity === 'LEGENDARY' ? <Star size={32} /> : <Medal size={32} />}
                  {!isUnlocked && <div style={s.lockedIcon}><Lock size={12} /></div>}
                </div>
                <div style={s.name}>{a.name}</div>
                <div style={s.desc}>{a.description}</div>
                <div style={{ ...s.rarityBadge, background: colors.bg, color: colors.text }}>
                  {t.rarities[a.rarity] || a.rarity}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
