'use client';

/**
 * Vertex — Landing Page
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './Landing.module.css';
import { Zap, Gift, Target, Gamepad2, Trophy, BarChart3, ArrowRight } from 'lucide-react';
import { landing as t } from '@/lib/i18n/es';

const FEATURE_ICONS = [Zap, Gift, Target, Gamepad2, Trophy, BarChart3];
const FEATURE_COLORS = ['Purple', 'Cyan', 'Green', 'Yellow', 'Pink', 'Blue'];

export default function LandingClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) return;

        const gsapModule = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        const gsap = gsapModule.default || gsapModule;
        gsap.registerPlugin(ScrollTrigger);

        if (heroRef.current) {
          const tl = gsap.timeline();
          const badge = heroRef.current.querySelector(`.${styles.heroBadge}`);
          const title = heroRef.current.querySelector(`.${styles.heroTitle}`);
          const desc = heroRef.current.querySelector(`.${styles.heroDesc}`);
          const cta = heroRef.current.querySelector(`.${styles.heroCta}`);

          tl.fromTo(badge, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
            .fromTo(title, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2')
            .fromTo(desc, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
            .fromTo(cta, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');
        }

        if (featuresRef.current) {
          const cards = featuresRef.current.querySelectorAll(`.${styles.featureCard}`);
          gsap.fromTo(cards, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
            scrollTrigger: { trigger: featuresRef.current, start: 'top 80%', once: true },
          });
        }
      } catch {}
    };
    init();
  }, []);

  return (
    <div className={styles.landing}>
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.heroGrid} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            {t.badge}
          </div>
          <h1 className={styles.heroTitle}>
            {t.heroLine1}<br />
            {t.heroLine2} <span className={styles.heroHighlight}>{t.heroLine3}</span>.<br />
            {t.heroLine4}
          </h1>
          <p className={styles.heroDesc}>{t.heroDesc}</p>
          <div className={styles.heroCta}>
            <Link href="/register" className={styles.btnPrimary}>
              {t.getStarted} <ArrowRight size={18} />
            </Link>
            <Link href="/login" className={styles.btnSecondary}>
              {t.signIn}
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.sectionLabel}>{t.featuresLabel}</div>
          <h2 className={styles.sectionTitle}>{t.featuresTitle}</h2>
          <div className={styles.featuresGrid} ref={featuresRef}>
            {t.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              const colorClass = styles[`featureIcon${FEATURE_COLORS[i]}` as keyof typeof styles] || styles.featureIconPurple;
              return (
                <div key={f.title} className={styles.featureCard}>
                  <div className={`${styles.featureIconWrap} ${colorClass}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerText}>
          <span className={styles.footerBrand}>Vertex</span> — {t.footer}
        </p>
      </footer>
    </div>
  );
}
