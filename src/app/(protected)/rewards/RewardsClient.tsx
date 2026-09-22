'use client';

/**
 * Vertex - Tienda de Recompensas
 */

import { useState, useEffect, useRef } from 'react';
import { Package, Gift, Zap, CheckCircle } from 'lucide-react';
import styles from './Rewards.module.css';
import { rewards as t } from '@/lib/i18n/es';
import { Card, CardContent, Input, Button, Modal } from '@/components/ui';

interface Reward {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: string;
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
        if (res.ok) { 
          const data = await res.json(); 
          setRewards(data.rewards || []); 
        }
      } catch (err) {
        console.error('Error fetching rewards', err);
      } finally { 
        setLoading(false); 
      }
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
        gsap.fromTo(
          cards, 
          { opacity: 0, y: 24, scale: 0.97 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' }
        );
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

  const closeModal = () => { 
    setSelectedReward(null); 
    setTimeout(() => {
      setRedeemSuccess(false); 
      setRedeemError(''); 
    }, 300);
  };

  return (
    <div className={styles.store}>
      <div className={styles.storeHeader}>
        <h1 className={styles.storeTitle}>{t.title}</h1>
        <p className={styles.storeSubtitle}>{t.subtitle}</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchInputWrapper}>
          <Input 
            placeholder={t.searchPlaceholder} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        {CATEGORIES.map(cat => (
          <button 
            key={cat}
            className={`${styles.filterChip} ${category === cat ? styles.filterChipActive : ''}`}
            onClick={() => setCategory(cat)}
          >
            {t.categories[cat as keyof typeof t.categories] || cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.rewardsGrid}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`${styles.rewardCard} skeleton`} style={{ height: 320, borderRadius: '16px' }} />
          ))}
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
            <Card 
              key={reward.id} 
              className={styles.rewardCard} 
              onClick={() => setSelectedReward(reward)} 
              role="button" 
              tabIndex={0} 
              onKeyDown={(e) => e.key === 'Enter' && setSelectedReward(reward)}
            >
              <div className={styles.rewardImageWrap}>
                {reward.imageUrl ? (
                  <img src={reward.imageUrl} alt="" loading="lazy" />
                ) : (
                  <Package size={48} className={styles.rewardPlaceholder} />
                )}
                {reward.stock <= 3 && reward.stock > 0 && (
                  <div className={styles.rewardBadge}>{t.limited}</div>
                )}
              </div>
              <CardContent style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div className={styles.rewardCategory}>
                  {t.categories[reward.category as keyof typeof t.categories] || reward.category}
                </div>
                <h3 className={styles.rewardName}>{reward.name}</h3>
                {reward.description && (
                  <p className={styles.rewardDesc}>{reward.description}</p>
                )}
              </CardContent>
              <div className={styles.rewardFooter}>
                <div className={styles.rewardPrice}>
                  <Zap size={16} />
                  {reward.price.toLocaleString('es-EC')}
                </div>
                <div className={`${styles.rewardStock} ${reward.stock <= 3 ? styles.rewardStockLow : ''} ${reward.stock <= 0 ? styles.rewardStockOut : ''}`}>
                  {reward.stock <= 0 ? t.soldOut : t.left(reward.stock)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedReward}
        onClose={closeModal}
        title={redeemSuccess ? t.redeemed : selectedReward?.name}
        footer={
          !redeemSuccess && selectedReward && (
            <>
              <Button variant="secondary" onClick={closeModal}>{t.cancel}</Button>
              <Button 
                onClick={handleRedeem} 
                disabled={redeeming || selectedReward.stock <= 0}
              >
                {redeeming ? t.processing : selectedReward.stock <= 0 ? t.outOfStock : t.confirmRedeem}
              </Button>
            </>
          )
        }
      >
        {redeemSuccess ? (
          <div className={styles.successMsg}>
            <CheckCircle className={styles.successIcon} />
            <div className={styles.successTitle}>{t.rewardClaimed}</div>
            <div className={styles.successDesc}>{t.rewardClaimedDesc}</div>
          </div>
        ) : selectedReward && (
          <>
            {redeemError && (
              <div style={{ padding: '12px 16px', background: 'rgba(255, 1, 1, 0.1)', borderRadius: '12px', color: 'var(--color-red-500, #ff0101)', fontSize: '14px', marginBottom: '16px' }}>
                {redeemError}
              </div>
            )}
            {selectedReward.description && (
              <p style={{ fontSize: '14px', color: 'var(--color-gray-200, #a3abbb)', marginBottom: '16px', lineHeight: '1.5' }}>
                {selectedReward.description}
              </p>
            )}
            <div className={styles.confirmPrice}>
              <div className={styles.confirmPriceValue}>
                {selectedReward.price.toLocaleString('es-EC')}
              </div>
              <div className={styles.confirmPriceLabel}>{t.pointsDeducted}</div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
