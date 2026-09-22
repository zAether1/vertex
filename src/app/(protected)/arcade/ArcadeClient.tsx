'use client';

import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Zap, Coins, Dice5, RotateCw, CircleDot, CheckCircle, XCircle } from 'lucide-react';
import { arcade as t } from '@/lib/i18n/es';
import styles from './Arcade.module.css';
import { Card, Button, Input, Modal } from '@/components/ui';

const GAME_ICONS: Record<string, React.ReactNode> = {
  COIN_FLIP: <Coins size={48} style={{ color: 'var(--color-yellow-500, #ffc300)' }} />,
  DICE: <Dice5 size={48} style={{ color: 'var(--color-blue-cyan-500, #0075ff)' }} />,
  ROULETTE: <RotateCw size={48} style={{ color: 'var(--color-green-500, #00d95b)' }} />,
  SLOTS: <CircleDot size={48} style={{ color: 'var(--color-red-500, #ff0101)' }} />,
};

interface Game {
  id: string; 
  name: string; 
  description: string | null; 
  type: string;
  imageUrl: string | null; 
  minBet: number; 
  maxBet: number; 
  payoutMultiplier: number;
}

export default function ArcadeClient() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [bet, setBet] = useState(10);
  const [choice, setChoice] = useState<string>('heads');
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<{ won: boolean; payout: number; netResult: number; resultData?: Record<string, unknown> } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch('/api/games');
        if (res.ok) { 
          const data = await res.json(); 
          setGames(data.games || []); 
        }
      } catch {} finally { 
        setLoading(false); 
      }
    };
    fetchGames();
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
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
  }, [loading]);

  const handlePlay = async () => {
    if (!activeGame || playing) return;
    setPlaying(true);
    setResult(null);
    try {
      const res = await fetch('/api/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: activeGame.id, betAmount: bet, choice }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ won: data.result === 'WIN', payout: data.payout, netResult: data.netResult, resultData: data.resultData });
      } else {
        setResult({ won: false, payout: 0, netResult: -bet, resultData: { error: data.error } });
      }
    } catch {
      setResult({ won: false, payout: 0, netResult: 0, resultData: { error: 'Error de conexión' } });
    } finally { 
      setPlaying(false); 
    }
  };

  const openGame = (game: Game) => {
    setActiveGame(game);
    setBet(game.minBet);
    setChoice(game.type === 'COIN_FLIP' ? 'heads' : '4');
    setResult(null);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className={`skeleton ${styles.arcadeCard}`} style={{ height: 300 }} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className={styles.emptyState}>
          <Gamepad2 size={48} className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>{t.noGames}</div>
          <div className={styles.emptyDesc}>{t.noGamesDesc}</div>
        </div>
      ) : (
        <div className={styles.grid} ref={gridRef}>
          {games.map(game => (
            <Card key={game.id} className={styles.arcadeCard}>
              <div className={styles.cardIcon}>
                {GAME_ICONS[game.type] || <Gamepad2 size={48} style={{ color: 'var(--color-gray-300, #818794)' }} />}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{game.name}</div>
                <div className={styles.cardDesc}>{game.description || t.playNow}</div>
                <div className={styles.cardMeta}>
                  <span className={styles.metaItem}><Zap size={12} /> {game.minBet} — {game.maxBet} pts</span>
                  <span className={styles.metaItem}>{t.payout}: {(game.payoutMultiplier / 100).toFixed(1)}x</span>
                </div>
                <Button onClick={() => openGame(game)} style={{ width: '100%', marginTop: 'auto' }}>
                  <Gamepad2 size={16} style={{ marginRight: '8px' }} /> {t.playNow}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!activeGame}
        onClose={() => !playing && setActiveGame(null)}
        title={activeGame?.name}
        footer={
          result ? (
            <>
              <Button variant="secondary" onClick={() => setResult(null)} style={{ flex: 1 }}>{t.playAgain}</Button>
              <Button onClick={() => setActiveGame(null)} style={{ flex: 1 }}>{t.close}</Button>
            </>
          ) : (
            <Button onClick={handlePlay} disabled={playing} style={{ width: '100%' }}>
              {playing ? t.playing : t.play(bet)}
            </Button>
          )
        }
      >
        {activeGame && (
          <div style={{ padding: '8px 0' }}>
            {result ? (
              <div className={styles.result}>
                {result.won ? (
                  <CheckCircle className={styles.resultIcon} style={{ color: 'var(--color-green-500, #00d95b)' }} />
                ) : (
                  <XCircle className={styles.resultIcon} style={{ color: 'var(--color-red-500, #ff0101)' }} />
                )}
                <div className={styles.resultTitle} style={{ color: result.won ? 'var(--color-green-500, #00d95b)' : 'var(--color-red-500, #ff0101)' }}>
                  {result.won ? t.youWon : t.youLost}
                </div>
                <div className={styles.resultAmount} style={{ color: result.netResult >= 0 ? 'var(--color-green-500, #00d95b)' : 'var(--color-red-500, #ff0101)' }}>
                  {result.netResult >= 0 ? '+' : ''}{result.netResult} pts
                </div>
              </div>
            ) : (
              <>
                <div className={styles.betSection}>
                  <label className={styles.betLabel}>{t.betAmount}</label>
                  <Input 
                    type="number" 
                    value={bet} 
                    onChange={(e) => setBet(Math.max(activeGame.minBet, Math.min(activeGame.maxBet, parseInt(e.target.value) || activeGame.minBet)))} 
                    min={activeGame.minBet} 
                    max={activeGame.maxBet} 
                    disabled={playing}
                    style={{ textAlign: 'center', fontSize: '18px', fontWeight: 600 }}
                  />
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-300, #818794)', marginTop: '8px', textAlign: 'center' }}>
                    {t.minBet}: {activeGame.minBet} — {t.maxBet}: {activeGame.maxBet}
                  </div>
                </div>
                
                {activeGame.type === 'COIN_FLIP' && (
                  <div className={styles.choiceGrid}>
                    {(['heads', 'tails'] as const).map(c => (
                      <button 
                        key={c} 
                        className={`${styles.choiceBtn} ${choice === c ? styles.choiceActive : ''}`} 
                        onClick={() => setChoice(c)} 
                        disabled={playing}
                      >
                        {c === 'heads' ? t.heads : t.tails}
                      </button>
                    ))}
                  </div>
                )}
                
                {activeGame.type === 'DICE' && (
                  <div className={styles.choiceGridThree}>
                    {[2, 3, 4, 5, 6].map(n => (
                      <button 
                        key={n} 
                        className={`${styles.choiceBtn} ${choice === String(n) ? styles.choiceActive : ''}`} 
                        onClick={() => setChoice(String(n))} 
                        disabled={playing}
                      >
                        {n}+
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
