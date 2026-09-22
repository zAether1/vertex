'use client';

import Link from 'next/link';
import styles from './Header.module.css';

interface HeaderProps {
  username?: string;
  avatarUrl?: string | null;
  balance?: number;
}

export default function Header({ username, avatarUrl, balance }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontFamily: 'var(--font-coolvetica)', fontSize: '24px', letterSpacing: '1px' }}>
          VERTEX
        </Link>
      </div>
      
      <div className={styles.right}>
        {balance !== undefined && (
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>
            {balance} PTS
          </div>
        )}
        
        {username ? (
          <>
            <button className={styles.button}>Depositar</button>
            <div className={styles.avatar} style={{ backgroundImage: avatarUrl ? `url(${avatarUrl})` : 'none', backgroundSize: 'cover' }} />
          </>
        ) : (
          <Link href="/login" className={styles.button} style={{ textDecoration: 'none' }}>
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}

