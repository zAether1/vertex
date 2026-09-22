'use client';

/**
 * Vertex â€” PÃ¡gina de inicio de sesiÃ³n
 *
 * - Email/contraseÃ±a
 * - Google OAuth
 * - GSAP animaciÃ³n de entrada
 * - Todo en espaÃ±ol
 */

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './Login.module.css';
import { Gem } from 'lucide-react';
import { auth as t } from '@/lib/i18n/es';

export default function LoginClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const authError = searchParams.get('error');

  useEffect(() => {
    if (authError === 'suspended') {
      setError(t.errors.suspended);
    } else if (authError) {
      setError(t.errors.genericAuth);
    }
  }, [authError]);

  // GSAP entrance
  useEffect(() => {
    const initAnimation = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const gsapModule = await import('gsap');
        const gsap = gsapModule.default || gsapModule;

        if (cardRef.current) {
          gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 30, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' }
          );
        }
      } catch {}
    };
    initAnimation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(t.errors.invalidCredentials);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError(t.errors.genericError);
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    signIn('google', { callbackUrl });
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard} ref={cardRef}>
          {/* Logo */}
          <div className={styles.loginLogo}>
            <div className={styles.loginLogoIcon}>
              <Gem size={24} />
            </div>
            <span className={styles.loginLogoText}>Vertex</span>
          </div>

          <h1 className={styles.loginTitle}>{t.loginTitle}</h1>
          <p className={styles.loginSubtitle}>{t.loginSubtitle}</p>

          {/* Error */}
          {error && <div className={styles.alertError}>{error}</div>}

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                {t.email}
              </label>
              <input
                id="email"
                type="email"
                className={styles.formInput}
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                {t.password}
              </label>
              <input
                id="password"
                type="password"
                className={styles.formInput}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : t.signIn}
            </button>
          </form>

          {/* OAuth */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>{t.orContinueWith}</span>
          </div>

          <div className={styles.oauthBtns}>
            <button
              type="button"
              className={styles.oauthBtn}
              onClick={handleGoogle}
              disabled={loading}
            >
              <svg className={styles.oauthIcon} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t.continueWithGoogle}
            </button>
          </div>

          {/* Footer */}
          <div className={styles.footerLink}>
            {t.noAccount}{' '}
            <Link href="/register">{t.createAccount}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

