'use client';

/**
 * Vertex — Página de registro
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../login/Login.module.css';
import { Gem } from 'lucide-react';
import { auth as t } from '@/lib/i18n/es';

export default function RegisterClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;
        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;
        if (cardRef.current) {
          gsap.fromTo(cardRef.current, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' });
        }
      } catch {}
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          username: username.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t.errors.registrationFailed);
        setLoading(false);
        return;
      }

      router.push('/login?registered=true');
    } catch {
      setError(t.errors.genericError);
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard} ref={cardRef}>
          <div className={styles.loginLogo}>
            <div className={styles.loginLogoIcon}><Gem size={24} /></div>
            <span className={styles.loginLogoText}>Vertex</span>
          </div>

          <h1 className={styles.loginTitle}>{t.registerTitle}</h1>
          <p className={styles.loginSubtitle}>{t.registerSubtitle}</p>

          {error && <div className={styles.alertError}>{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>{t.username}</label>
              <input id="username" type="text" className={styles.formInput} placeholder={t.usernamePlaceholder} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required disabled={loading} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>{t.email}</label>
              <input id="email" type="email" className={styles.formInput} placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required disabled={loading} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>{t.password}</label>
              <input id="password" type="password" className={styles.formInput} placeholder={t.passwordMinHint} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required disabled={loading} minLength={8} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : t.signUp}
            </button>
          </form>

          <div className={styles.footerLink}>
            {t.hasAccount} <Link href="/login">{t.goToLogin}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
