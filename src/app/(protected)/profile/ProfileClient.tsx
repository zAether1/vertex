'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Save, LogOut, AlertCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { profile as t } from '@/lib/i18n/es';
import styles from './Profile.module.css';
import { Card, CardContent, Input, Button } from '@/components/ui';

interface ProfileData {
  username: string;
  displayAlias: string;
  bio: string;
  email: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  balance: number;
}

export default function ProfileClient() {
  const [profileData, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [formAlias, setFormAlias] = useState('');
  const [formBio, setFormBio] = useState('');
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Error al cargar perfil');
        const json = await res.json();
        setProfile(json.data);
        setFormAlias(json.data.displayAlias || '');
        setFormBio(json.data.bio || '');
      } catch (err) {
        setError('No se pudo cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (loading || !cardRef.current || !profileData) return;
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        gsap.fromTo(cardRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      } catch {}
    };
    init();
  }, [loading, profileData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayAlias: formAlias, bio: formBio })
      });
      if (!res.ok) throw new Error('Error al guardar');
      setSaveMessage('Perfil actualizado correctamente');
      setProfile(prev => prev ? { ...prev, displayAlias: formAlias, bio: formBio } : null);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setError('No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className={styles.page}>
      <Card className="skeleton" style={{ height: 400 }} />
    </div>
  );

  if (error && !profileData) return (
    <div className={styles.page}>
      <Card>
        <CardContent style={{ padding: '24px', textAlign: 'center', color: 'var(--color-error)' }}>
          <AlertCircle size={24} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
        </CardContent>
      </Card>
    </div>
  );
  
  if (!profileData) return null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>
      </div>

      <div ref={cardRef}>
        <Card className={styles.card}>
          <CardContent style={{ padding: '24px' }}>
            <h2 className={styles.sectionTitle}>{t.publicIdentity}</h2>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  {profileData.avatarUrl ? <img src={profileData.avatarUrl} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}}/> : (profileData.displayAlias || profileData.username).charAt(0).toUpperCase()}
                </div>
                <button className={styles.avatarBtn} aria-label={t.changeAvatar}><Camera size={16} /></button>
              </div>
              <div className={styles.info}>
                <div className={styles.infoTitle}>{profileData.displayAlias || profileData.username} <span style={{fontSize: '12px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px'}}>Nv. {profileData.level}</span></div>
                <div className={styles.infoSubtitle}>@{profileData.username}</div>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t.displayAlias}</label>
                <Input type="text" value={formAlias} onChange={(e) => setFormAlias(e.target.value)} disabled={saving} />
                <span className={styles.hint}>{t.displayAliasHint}</span>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t.bio}</label>
                <textarea className={styles.textarea} value={formBio} onChange={(e) => setFormBio(e.target.value)} disabled={saving} />
              </div>
              {error && <div style={{color: 'var(--color-error)', fontSize: '14px'}}>{error}</div>}
              {saveMessage && <div style={{color: 'var(--color-success)', fontSize: '14px'}}>{saveMessage}</div>}
              <Button className={styles.btnSave} disabled={saving}>
                <Save size={16} style={{ marginRight: '8px' }} /> {saving ? 'Guardando...' : t.saveChanges}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className={styles.card}>
        <CardContent style={{ padding: '24px' }}>
          <h2 className={styles.sectionTitle}>{t.accountDetails}</h2>
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t.emailAddress}</label>
              <Input type="email" defaultValue={profileData.email} disabled />
              <span className={styles.hint}>{t.emailHint}</span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Puntos y Progreso</label>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', flex: 1, minWidth: '120px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-200)' }}>Balance Actual</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{profileData.balance?.toLocaleString() || 0} pts</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', flex: 1, minWidth: '120px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-gray-200)' }}>Experiencia (XP)</div>
                  <div style={{ fontSize: '18px', fontWeight: 600 }}>{profileData.xp?.toLocaleString() || 0} XP</div>
                </div>
              </div>
            </div>
            <div className={styles.dangerSection}>
              <Button className={styles.btnDanger} onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut size={16} style={{ marginRight: '8px' }} /> {t.signOut}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
