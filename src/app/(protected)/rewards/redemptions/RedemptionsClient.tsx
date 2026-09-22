'use client';

import { useState, useEffect, useRef } from 'react';
import { Package, Copy, CheckCircle, Clock, XCircle, Key, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Redemption {
  id: string;
  pointsSpent: number;
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  reward: {
    name: string;
    category: string;
    imageUrl: string | null;
    hasPrivatePayload: boolean;
  };
  secretCode: string | null;
}

const s = {
  page: { padding: 'var(--space-6)', maxWidth: 1000, margin: '0 auto' } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text-primary)' } as React.CSSProperties,
  subtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 'var(--text-sm)', fontWeight: 500, transition: 'color 0.2s' } as React.CSSProperties,
  grid: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-4)' } as React.CSSProperties,
  card: { display: 'flex', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 'var(--space-4)', gap: 'var(--space-5)', alignItems: 'center' } as React.CSSProperties,
  imageBox: { width: 80, height: 80, borderRadius: 'var(--radius-md)', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' } as React.CSSProperties,
  info: { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: '4px' } as React.CSSProperties,
  rewardName: { fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' } as React.CSSProperties,
  meta: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', display: 'flex', gap: '16px', alignItems: 'center' } as React.CSSProperties,
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)', fontWeight: 600 } as React.CSSProperties,
  price: { fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-accent-primary)' } as React.CSSProperties,
  codeSection: { display: 'flex', flexDirection: 'column' as const, gap: '8px', alignItems: 'flex-end', minWidth: 250 } as React.CSSProperties,
  codeBox: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-tertiary)', border: '1px dashed var(--color-border-secondary)', borderRadius: 'var(--radius-md)', padding: '8px 12px', fontSize: 'var(--text-sm)', fontFamily: 'monospace' } as React.CSSProperties,
  codeHidden: { filter: 'blur(4px)', userSelect: 'none' as const } as React.CSSProperties,
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' } as React.CSSProperties,
  emptyState: { textAlign: 'center' as const, padding: 'var(--space-12) 0', color: 'var(--color-text-secondary)' } as React.CSSProperties,
};

function StatusBadge({ status }: { status: Redemption['status'] }) {
  if (status === 'FULFILLED') return <span style={{ ...s.statusBadge, background: 'var(--color-success-subtle)', color: 'var(--color-success)' }}><CheckCircle size={14} /> Entregado</span>;
  if (status === 'PENDING' || status === 'APPROVED') return <span style={{ ...s.statusBadge, background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}><Clock size={14} /> Pendiente</span>;
  return <span style={{ ...s.statusBadge, background: 'var(--color-error-subtle)', color: 'var(--color-error)' }}><XCircle size={14} /> {status === 'CANCELLED' ? 'Cancelado' : 'Expirado'}</span>;
}

function CodeReveal({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err: unknown) {
      // Fallback si Clipboard API falla
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(textArea);
    }
  };

  return (
    <div style={s.codeSection}>
      <div style={s.codeBox}>
        <Key size={16} color="var(--color-text-muted)" />
        <span style={revealed ? {} : s.codeHidden}>{revealed ? code : 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'}</span>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={s.actionBtn} onClick={() => setRevealed(!revealed)}>
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          {revealed ? 'Ocultar cÃ³digo' : 'Mostrar cÃ³digo'}
        </button>
        {revealed && (
          <button style={{ ...s.actionBtn, color: copied ? 'var(--color-success)' : 'var(--color-accent-primary)' }} onClick={copyToClipboard}>
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? 'CÃ³digo copiado' : 'Copiar cÃ³digo'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function RedemptionsClient() {
  const [items, setItems] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRedemptions = async () => {
      try {
        const res = await fetch('/api/redemptions/me');
        if (!res.ok) {
          if (res.status === 429) throw new Error('Demasiadas solicitudes. Intenta mÃ¡s tarde.');
          throw new Error('Error al cargar redenciones');
        }
        const data = await res.json();
        setItems(data.data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchRedemptions();
  }, []);

  useEffect(() => {
    if (loading || items.length === 0 || !listRef.current) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(listRef.current!.children, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out' });
      } catch {}
    };
    init();
  }, [loading, items.length]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Mis Redenciones</h1>
          <p style={s.subtitle}>Historial de recompensas obtenidas</p>
        </div>
        <Link href="/rewards" style={s.backBtn}>Ir a la tienda</Link>
      </div>

      {loading ? (
        <div style={s.grid}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ ...s.card, height: 112 }} />)}
        </div>
      ) : error ? (
        <div style={{ ...s.card, justifyContent: 'center', color: 'var(--color-error)' }}><AlertCircle size={20} /> {error}</div>
      ) : items.length === 0 ? (
        <div style={s.emptyState}>
          <Package size={48} color="var(--color-border-secondary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-primary)', marginBottom: '8px' }}>AÃºn no tienes recompensas</h3>
          <p>Visita la tienda y canjea tus puntos por recompensas increÃ­bles.</p>
        </div>
      ) : (
        <div style={s.grid} ref={listRef}>
          {items.map((item) => (
            <div key={item.id} style={s.card}>
              <div style={s.imageBox}>
                {item.reward.imageUrl ? (
                  <img src={item.reward.imageUrl} alt={item.reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                ) : (
                  <Package size={32} />
                )}
              </div>
              <div style={s.info}>
                <div style={s.rewardName}>{item.reward.name}</div>
                <div style={s.meta}>
                  <StatusBadge status={item.status} />
                  <span>{new Date(item.createdAt).toLocaleDateString('es-EC')}</span>
                  <span style={s.price}>{item.pointsSpent.toLocaleString('es-EC')} pts</span>
                </div>
              </div>
              
              {item.secretCode && item.status === 'FULFILLED' ? (
                <CodeReveal code={item.secretCode} />
              ) : item.reward.hasPrivatePayload && item.status === 'PENDING' ? (
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>
                  Pendiente de entrega
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



