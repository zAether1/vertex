'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Rewards.module.css';
import { Gift, Zap, X, CheckCircle, Package } from 'lucide-react';
import { rewards as t } from '@/lib/i18n/es';

interface Reward {
  id: string; name: string; description: string | null; imageUrl: string | null;
  price: number; category: string; stock: number; maxPerUser: number; conditions: string | null;
}

const CATEGORIES = ['All', 'VIDEOGAMES', 'GIFT_CARDS', 'ACCOUNTS', 'PRODUCTS', 'PLATFORM_PERKS', 'SPECIAL', 'PHYSICAL', 'DIGITAL'];

export default function RewardsClient() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const res = await fetch('/api/rewards');
        if (res.ok) { const data = await res.json(); setRewards(data.rewards || []); }
      } catch {} finally { setLoading(false); }
    };
    fetchRewards();
  }, []);

  useEffect(() => {
    if (loading || !gridRef.current) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        const cards = gridRef.current!.querySelectorAll(`.${styles.rewardCard}`);
        gsap.fromTo(cards, { opacity: 0, y: 24, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
      } catch {}
    };
    init();
  }, [loading, category]);

  const filtered = rewards.filter(r => {
    if (category !== 'All' && r.category !== category) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleRedeem = async () => {
    if (!selectedReward || redeeming) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: selectedReward.id,
          idempotencyKey: `${selectedReward.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRedeemSuccess(true);
        setRewards(prev => prev.map(r => r.id === selectedReward.id ? { ...r, stock: r.stock - 1 } : r));
      } else {
        setRedeemError(data.error || 'Error al canjear la recompensa');
      }
    } catch {
      setRedeemError('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setRedeeming(false);
    }
  };

  const closeModal = () => { setSelectedReward(null); setRedeemSuccess(false); setRedeemError(''); };

  return (
    <div className={styles.store}>
      <div className={styles.storeHeader}>
        <h1 className={styles.storeTitle}>{t.title}</h1>
        <p className={styles.storeSubtitle}>{t.subtitle}</p>
      </div>

      <div className={styles.filters}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <input type="text" className={styles.searchInput} placeholder={t.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {CATEGORIES.map(cat => (
          <button key={cat}
            className={`${styles.filterChip} ${category === cat ? styles.filterChipActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            {t.categories[cat] || cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.rewardsGrid}>
          {[...Array(6)].map((_, i) => <div key={i} className={`${styles.rewardCard} skeleton`} style={{ height: 320 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Gift className={styles.emptyIcon} />
          <div className={styles.emptyTitle}>{t.noRewards}</div>
          <div className={styles.emptyDesc}>{t.noRewardsDesc}</div>
        </div>
      ) : (
        <div className={styles.rewardsGrid} ref={gridRef}>
          {filtered.map(reward => (
            <div key={reward.id} className={styles.rewardCard} onClick={() => setSelectedReward(reward)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSelectedReward(reward)}>
              <div className={styles.rewardImageWrap}>
                {reward.imageUrl ? <img src={reward.imageUrl} alt="" loading="lazy" /> : <Package size={48} className={styles.rewardPlaceholder} />}
                {reward.stock <= 3 && reward.stock > 0 && <div className={styles.rewardBadge}>{t.limited}</div>}
              </div>
              <div className={styles.rewardBody}>
                <div className={styles.rewardCategory}>{t.categories[reward.category] || reward.category}</div>
                <h3 className={styles.rewardName}>{reward.name}</h3>
                {reward.description && <p className={styles.rewardDesc}>{reward.description}</p>}
              </div>
              <div className={styles.rewardFooter}>
                <div className={styles.rewardPrice}><Zap size={16} className={styles.rewardPriceIcon} />{reward.price.toLocaleString('es-EC')}</div>
                <div className={`${styles.rewardStock} ${reward.stock <= 3 ? styles.rewardStockLow : ''} ${reward.stock <= 0 ? styles.rewardStockOut : ''}`}>
                  {reward.stock <= 0 ? t.soldOut : t.left(reward.stock)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReward && (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeModal()} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>{redeemSuccess ? t.redeemed : selectedReward.name}</h2>
              <button className={styles.modalClose} onClick={closeModal} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {redeemSuccess ? (
                <div className={styles.successMsg}>
                  <CheckCircle className={styles.successIcon} />
                  <div className={styles.successTitle}>{t.rewardClaimed}</div>
                  <div className={styles.successDesc}>{t.rewardClaimedDesc}</div>
                </div>
              ) : (
                <>
                  {redeemError && <div style={{ padding: '8px 12px', background: 'var(--color-error-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>{redeemError}</div>}
                  {selectedReward.description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>{selectedReward.description}</p>}
                  <div className={styles.confirmPrice}>
                    <div className={styles.confirmPriceValue}>{selectedReward.price.toLocaleString('es-EC')}</div>
                    <div className={styles.confirmPriceLabel}>{t.pointsDeducted}</div>
                  </div>
                </>
              )}
            </div>
            {!redeemSuccess && (
              <div className={styles.modalFooter}>
                <button className={styles.btnCancel} onClick={closeModal}>{t.cancel}</button>
                <button className={styles.btnConfirm} onClick={handleRedeem} disabled={redeeming || selectedReward.stock <= 0}>
                  {redeeming ? t.processing : selectedReward.stock <= 0 ? t.outOfStock : t.confirmRedeem}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
