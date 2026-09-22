'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Save, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { profile as t } from '@/lib/i18n/es';

const s = {
  page: { padding: 'var(--space-6)', maxWidth: 800, margin: '0 auto' } as React.CSSProperties,
  header: { marginBottom: 'var(--space-8)' } as React.CSSProperties,
  title: { fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: 'var(--tracking-tight)', color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  subtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  card: { background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', marginBottom: 'var(--space-6)' } as React.CSSProperties,
  sectionTitle: { fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-6)' } as React.CSSProperties,
  profileHeader: { display: 'flex', alignItems: 'center', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' } as React.CSSProperties,
  avatarWrap: { position: 'relative' as const, width: 96, height: 96 } as React.CSSProperties,
  avatar: { width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden' } as React.CSSProperties,
  avatarBtn: { position: 'absolute' as const, bottom: 0, right: 0, width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)', transition: 'transform 0.15s' } as React.CSSProperties,
  info: { flex: 1 } as React.CSSProperties,
  infoTitle: { fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' } as React.CSSProperties,
  infoSubtitle: { fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
  form: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-5)' } as React.CSSProperties,
  formGroup: { display: 'flex', flexDirection: 'column' as const, gap: 'var(--space-2)' } as React.CSSProperties,
  label: { fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' } as React.CSSProperties,
  input: { width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', outline: 'none', transition: 'border-color 0.15s' } as React.CSSProperties,
  textarea: { width: '100%', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--color-text-primary)', fontSize: 'var(--text-base)', outline: 'none', transition: 'border-color 0.15s', minHeight: 100, resize: 'vertical' as const } as React.CSSProperties,
  btnSave: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 'var(--space-3) var(--space-6)', background: 'var(--gradient-primary)', border: 'none', borderRadius: 'var(--radius-md)', color: 'white', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 0.15s', alignSelf: 'flex-start' as const } as React.CSSProperties,
  btnDanger: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: 'var(--space-3) var(--space-6)', background: 'transparent', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontWeight: 600, fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 0.15s' } as React.CSSProperties,
  hint: { fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' } as React.CSSProperties,
};

export default function ProfileClient() {
  const [profileData, setProfile] = useState<{ username: string; displayAlias: string; bio: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfile({ username: 'student123', displayAlias: 'ShadowNinja', bio: 'Listo para la siguiente misión.', email: 'student@example.com' });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || !cardRef.current) return;
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
  }, [loading]);

  if (loading || !profileData) return <div style={s.page}><div className="skeleton" style={{ ...s.card, height: 400 }} /></div>;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>{t.title}</h1>
        <p style={s.subtitle}>{t.subtitle}</p>
      </div>

      <div style={s.card} ref={cardRef}>
        <h2 style={s.sectionTitle}>{t.publicIdentity}</h2>
        <div style={s.profileHeader}>
          <div style={s.avatarWrap}>
            <div style={s.avatar}>{profileData.displayAlias.charAt(0).toUpperCase()}</div>
            <button style={s.avatarBtn} aria-label={t.changeAvatar}><Camera size={16} /></button>
          </div>
          <div style={s.info}>
            <div style={s.infoTitle}>{profileData.displayAlias}</div>
            <div style={s.infoSubtitle}>@{profileData.username}</div>
          </div>
        </div>

        <form style={s.form} onSubmit={(e) => e.preventDefault()}>
          <div style={s.formGroup}>
            <label style={s.label}>{t.displayAlias}</label>
            <input type="text" style={s.input} defaultValue={profileData.displayAlias} />
            <span style={s.hint}>{t.displayAliasHint}</span>
          </div>
          <div style={s.formGroup}>
            <label style={s.label}>{t.bio}</label>
            <textarea style={s.textarea} defaultValue={profileData.bio} />
          </div>
          <button style={s.btnSave}><Save size={16} /> {t.saveChanges}</button>
        </form>
      </div>

      <div style={s.card}>
        <h2 style={s.sectionTitle}>{t.accountDetails}</h2>
        <div style={s.form}>
          <div style={s.formGroup}>
            <label style={s.label}>{t.emailAddress}</label>
            <input type="email" style={s.input} defaultValue={profileData.email} disabled />
            <span style={s.hint}>{t.emailHint}</span>
          </div>
          <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border-primary)' }}>
            <button style={s.btnDanger} onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut size={16} /> {t.signOut}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
