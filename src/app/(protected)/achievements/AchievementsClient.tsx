'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, Medal, Star, AlertCircle } from 'lucide-react';
import { achievements as t } from '@/lib/i18n/es';
import styles from './Achievements.module.css';
import { Card, CardContent } from '@/components/ui';

const RARITY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  COMMON: { bg: 'rgba(179, 182, 189, 0.08)', text: 'var(--color-gray-200, #a3abbb)', icon: 'var(--color-gray-300, #818794)' },
  UNCOMMON: { bg: 'rgba(0, 217, 91, 0.15)', text: 'var(--color-green-500, #00d95b)', icon: 'var(--color-green-500, #00d95b)' },
  RARE: { bg: 'rgba(0, 117, 255, 0.15)', text: 'var(--color-blue-cyan-500, #0075ff)', icon: 'var(--color-blue-cyan-500, #0075ff)' },
  EPIC: { bg: 'rgba(255, 1, 1, 0.15)', text: 'var(--color-red-500, #ff0101)', icon: 'var(--color-red-500, #ff0101)' },
  LEGENDARY: { bg: 'rgba(255, 195, 0, 0.15)', text: '#ffc300', icon: '#ffc300' },
};

interface Achievement {
  id: string; 
  name: string; 
  description: string; 
  rarity: string; 
  isUnlocked: boolean;
  awardedAt: string | null;
}

export default function AchievementsClient() {
  const [achievementsList, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch('/api/achievements');
        if (!res.ok) throw new Error('Error al cargar logros');
        const json = await res.json();
        setAchievements(json.data || []);
      } catch (err) {
        setError('No se pudieron cargar los logros');
      } finally {
        setLoading(false);
      }
    };
    fetchAchievements();
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current || achievementsList.length === 0) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(
          gridRef.current!.children, 
          { opacity: 0, scale: 0.9 }, 
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.5)' }
        );
      } catch {}
    };
    init();
  }, [loading, achievementsList]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>
      
      {loading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className={`skeleton ${styles.achievementCard}`} style={{ height: 200 }} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 12px' }} />
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : achievementsList.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Medal size={48} color="var(--color-gray-300)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>No hay logros disponibles</h3>
            <p style={{ color: 'var(--color-gray-200)', fontSize: '14px' }}>Vuelve más tarde para descubrir nuevos desafíos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.grid} ref={gridRef}>
          {achievementsList.map(a => {
            const isUnlocked = a.isUnlocked;
            const colors = RARITY_COLORS[a.rarity] || RARITY_COLORS.COMMON;
            
            return (
              <Card 
                key={a.id} 
                className={`${styles.achievementCard} ${!isUnlocked ? styles.lockedCard : ''}`}
              >
                <CardContent style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className={styles.iconWrap} style={{ background: colors.bg, color: colors.icon }}>
                    {a.rarity === 'LEGENDARY' ? <Star size={32} /> : <Medal size={32} />}
                    {!isUnlocked && (
                      <div className={styles.lockedIcon}>
                        <Lock size={12} />
                      </div>
                    )}
                  </div>
                  <div className={styles.name}>{a.name}</div>
                  <div className={styles.desc}>{a.description}</div>
                  <div className={styles.rarityBadge} style={{ background: colors.bg, color: colors.text }}>
                    {t.rarities[a.rarity as keyof typeof t.rarities] || a.rarity}
                  </div>
                  {isUnlocked && a.awardedAt && (
                    <div style={{ fontSize: '12px', color: 'var(--color-gray-200)', marginTop: '12px' }}>
                      Desbloqueado el {new Date(a.awardedAt).toLocaleDateString('es-EC')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
