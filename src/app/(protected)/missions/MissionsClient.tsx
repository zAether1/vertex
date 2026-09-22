'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, Zap, CheckCircle, AlertCircle, Gift } from 'lucide-react';
import { missions as t } from '@/lib/i18n/es';
import styles from './Missions.module.css';
import { Card, CardContent, Button } from '@/components/ui';

interface Mission {
  id: string; 
  name: string; 
  description: string | null; 
  reward: number; 
  targetValue: number; 
  currentValue: number; 
  isCompleted: boolean;
  isClaimed: boolean;
  status: string;
}

export default function MissionsClient() {
  const [missionsList, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMissions = async () => {
      try {
        const res = await fetch('/api/missions');
        if (!res.ok) throw new Error('Error al cargar misiones');
        const json = await res.json();
        setMissions(json.data || []);
      } catch (err) {
        setError('No se pudieron cargar las misiones');
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current || missionsList.length === 0) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(
          gridRef.current!.children, 
          { opacity: 0, y: 20 }, 
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
        );
      } catch {}
    };
    init();
  }, [loading, missionsList]);

  const handleClaim = async (missionId: string) => {
    setClaimingId(missionId);
    try {
      const res = await fetch('/api/missions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reclamar misiÃ³n');
      
      // Update local state
      setMissions(prev => prev.map(m => m.id === missionId ? { ...m, isClaimed: true, status: 'CLAIMED' } : m));
    } catch (err: unknown) {
      alert((err instanceof Error ? err.message : '') || 'Error al reclamar la misiÃ³n');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>
      
      {loading ? (
        <div className={styles.grid}>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className={`skeleton ${styles.missionCard}`} style={{ height: 160 }} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)' }}>
            <AlertCircle size={24} style={{ margin: '0 auto 12px' }} />
            <p>{error}</p>
          </CardContent>
        </Card>
      ) : missionsList.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Target size={48} color="var(--color-gray-300)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>No hay misiones disponibles</h3>
            <p style={{ color: 'var(--color-gray-200)', fontSize: '14px' }}>Vuelve mÃ¡s tarde para descubrir nuevas misiones.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={styles.grid} ref={gridRef}>
          {missionsList.map(mission => (
            <Card 
              key={mission.id} 
              className={`${styles.missionCard} ${mission.isCompleted ? styles.missionCardCompleted : ''}`}
            >
              <CardContent style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className={`${styles.iconWrap} ${mission.isCompleted ? styles.iconWrapCompleted : ''}`}>
                    {mission.isCompleted ? <CheckCircle size={24} /> : <Target size={24} />}
                  </div>
                  <div className={styles.info}>
                    <div className={styles.name}>{mission.name}</div>
                    <div className={styles.desc}>{mission.description}</div>
                    <div className={`${styles.reward} ${mission.isCompleted ? styles.rewardCompleted : ''}`}>
                      <Zap size={12} /> {mission.reward} pts
                    </div>
                  </div>
                </div>
                
                <div className={styles.progressSection}>
                  <div className={styles.progressLabels}>
                    <span>{t.progress}</span>
                    <span>{mission.currentValue} / {mission.targetValue}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={`${styles.progressFill} ${mission.isCompleted ? styles.progressFillCompleted : ''}`}
                      style={{ width: `${Math.min(100, (mission.currentValue / mission.targetValue) * 100)}%` }} 
                    />
                  </div>
                  
                  {mission.isCompleted && !mission.isClaimed && (
                    <Button 
                      onClick={() => handleClaim(mission.id)} 
                      disabled={claimingId === mission.id}
                      style={{ marginTop: '12px', width: '100%' }}
                    >
                      <Gift size={16} style={{ marginRight: '8px' }} />
                      {claimingId === mission.id ? 'Reclamando...' : 'Reclamar recompensa'}
                    </Button>
                  )}
                  {mission.isClaimed && (
                    <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: 'var(--color-success)', fontWeight: 600 }}>
                      âœ“ Recompensa reclamada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


