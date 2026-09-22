'use client';

import { useState, useEffect, useRef } from 'react';
import { Gamepad2, Zap, Coins, Dice5, RotateCw, CircleDot, X, CheckCircle, XCircle } from 'lucide-react';
import { arcade as t } from '@/lib/i18n/es';

const s = {
  page: { padding: 'var(--space-6)' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-6)' } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-5)' } as React.CSSProperties,
  card: { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' } as React.CSSProperties,
  cardIcon: { height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-tertiary)' } as React.CSSProperties,
  cardBody: { padding: 'var(--space-5)' } as React.CSSProperties,
  cardName: { fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  cardDesc: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)', lineHeight: 'var(--leading-relaxed)' } as React.CSSProperties,
  cardMeta: { display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' } as React.CSSProperties,
  metaItem: { display: 'flex', alignItems: 'center', gap: '4px' } as React.CSSProperties,
  playBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: 'var(--space-3)', background: 'var(--gradient-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', marginTop: 'var(--space-4)', transition: 'all 0.15s' } as React.CSSProperties,
  overlay: { position: 'fixed' as const, inset: 0, background: 'var(--color-bg-overlay)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' } as React.CSSProperties,
  modal: { background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-xl)', maxWidth: 440, width: '100%', boxShadow: 'var(--shadow-xl)' } as React.CSSProperties,
  modalHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border-primary)' } as React.CSSProperties,
  modalTitle: { fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' } as React.CSSProperties,
  closeBtn: { width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', cursor: 'pointer', background: 'none', border: 'none' } as React.CSSProperties,
  modalBody: { padding: 'var(--space-6)', textAlign: 'center' as const } as React.CSSProperties,
  betSection: { marginBottom: 'var(--space-5)' } as React.CSSProperties,
  betLabel: { fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)', display: 'block' } as React.CSSProperties,
  betInput: { width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-md)', textAlign: 'center' as const, fontWeight: 600, outline: 'none' } as React.CSSProperties,
  choiceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' } as React.CSSProperties,
  choiceBtn: { padding: 'var(--space-3)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', transition: 'all 0.15s' } as React.CSSProperties,
  choiceActive: { background: 'var(--color-accent-primary-subtle)', borderColor: 'var(--color-accent-primary)', color: 'var(--color-accent-primary-hover)' } as React.CSSProperties,
  result: { padding: 'var(--space-6) 0', textAlign: 'center' as const } as React.CSSProperties,
  resultIcon: { width: 56, height: 56, margin: '0 auto var(--space-3)' } as React.CSSProperties,
  resultTitle: { fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '4px' } as React.CSSProperties,
  resultAmount: { fontSize: 'var(--text-lg)', fontWeight: 600, marginTop: 'var(--space-2)' } as React.CSSProperties,
  actionRow: { display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--color-border-primary)' } as React.CSSProperties,
};

const GAME_ICONS: Record<string, React.ReactNode> = {
  COIN_FLIP: <Coins size={48} style={{ color: 'var(--color-warning)' }} />,
  DICE: <Dice5 size={48} style={{ color: 'var(--color-accent-primary)' }} />,
  ROULETTE: <RotateCw size={48} style={{ color: 'var(--color-success)' }} />,
  SLOTS: <CircleDot size={48} style={{ color: 'var(--color-accent-secondary)' }} />,
};

interface Game {
  id: string; name: string; description: string | null; type: string;
  imageUrl: string | null; minBet: number; maxBet: number; payoutMultiplier: number;
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
        if (res.ok) { const data = await res.json(); setGames(data.games || []); }
      } catch {} finally { setLoading(false); }
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
        gsap.fromTo(gridRef.current!.children, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
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
    } finally { setPlaying(false); }
  };

  const openGame = (game: Game) => {
    setActiveGame(game);
    setBet(game.minBet);
    setChoice(game.type === 'COIN_FLIP' ? 'heads' : '4');
    setResult(null);
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>{t.title}</h1>
        <p style={s.subtitle}>{t.subtitle}</p>
      </div>

      {loading ? (
        <div style={s.grid}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ ...s.card, height: 300 }} />)}</div>
      ) : games.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
          <Gamepad2 size={48} style={{ margin: '0 auto var(--space-4)', color: 'var(--color-text-muted)', opacity: 0.4 }} />
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{t.noGames}</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{t.noGamesDesc}</div>
        </div>
      ) : (
        <div style={s.grid} ref={gridRef}>
          {games.map(game => (
            <div key={game.id} style={s.card}>
              <div style={s.cardIcon}>{GAME_ICONS[game.type] || <Gamepad2 size={48} style={{ color: 'var(--color-text-muted)' }} />}</div>
              <div style={s.cardBody}>
                <div style={s.cardName}>{game.name}</div>
                <div style={s.cardDesc}>{game.description || t.playNow}</div>
                <div style={s.cardMeta}>
                  <span style={s.metaItem}><Zap size={12} /> {game.minBet}–{game.maxBet} pts</span>
                  <span style={s.metaItem}>{t.payout}: {(game.payoutMultiplier / 100).toFixed(1)}x</span>
                </div>
                <button style={s.playBtn} onClick={() => openGame(game)}>
                  <Gamepad2 size={16} /> {t.playNow}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeGame && (
        <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && !playing && setActiveGame(null)}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <h2 style={s.modalTitle}>{activeGame.name}</h2>
              <button style={s.closeBtn} onClick={() => !playing && setActiveGame(null)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <div style={s.modalBody}>
              {result ? (
                <div style={s.result}>
                  {result.won ? <CheckCircle style={{ ...s.resultIcon, color: 'var(--color-success)' }} /> : <XCircle style={{ ...s.resultIcon, color: 'var(--color-error)' }} />}
                  <div style={{ ...s.resultTitle, color: result.won ? 'var(--color-success)' : 'var(--color-error)' }}>{result.won ? t.youWon : t.youLost}</div>
                  <div style={{ ...s.resultAmount, color: result.netResult >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {result.netResult >= 0 ? '+' : ''}{result.netResult} pts
                  </div>
                </div>
              ) : (
                <>
                  <div style={s.betSection}>
                    <label style={s.betLabel}>{t.betAmount}</label>
                    <input type="number" style={s.betInput} value={bet} onChange={(e) => setBet(Math.max(activeGame.minBet, Math.min(activeGame.maxBet, parseInt(e.target.value) || activeGame.minBet)))} min={activeGame.minBet} max={activeGame.maxBet} disabled={playing} />
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>{t.minBet}: {activeGame.minBet} — {t.maxBet}: {activeGame.maxBet}</div>
                  </div>
                  {activeGame.type === 'COIN_FLIP' && (
                    <div style={s.choiceGrid}>
                      {(['heads', 'tails'] as const).map(c => (
                        <button key={c} style={{ ...s.choiceBtn, ...(choice === c ? s.choiceActive : {}) }} onClick={() => setChoice(c)} disabled={playing}>
                          {c === 'heads' ? t.heads : t.tails}
                        </button>
                      ))}
                    </div>
                  )}
                  {activeGame.type === 'DICE' && (
                    <div style={{ ...s.choiceGrid, gridTemplateColumns: 'repeat(3, 1fr)' }}>
                      {[2, 3, 4, 5, 6].map(n => (
                        <button key={n} style={{ ...s.choiceBtn, ...(choice === String(n) ? s.choiceActive : {}) }} onClick={() => setChoice(String(n))} disabled={playing}>
                          {n}+
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={s.actionRow}>
              {result ? (
                <>
                  <button style={{ ...s.choiceBtn, flex: 1 }} onClick={() => setResult(null)}>{t.playAgain}</button>
                  <button style={{ ...s.choiceBtn, flex: 1 }} onClick={() => setActiveGame(null)}>{t.close}</button>
                </>
              ) : (
                <button style={{ ...s.playBtn as React.CSSProperties, flex: 1, marginTop: 0 }} onClick={handlePlay} disabled={playing}>
                  {playing ? t.playing : t.play(bet)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
