import Image from 'next/image';
import styles from './AuthPage.module.css';

export function AuthCard({
  subtitle,
  children,
  footer,
}: {
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className={styles.wrapper}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <Image src="/logo.png" alt="" width={48} height={48} priority className={styles.brandMark} />
          <span className={styles.brandText}>Wallet</span>
        </div>

        <div className={styles.intro}>
          <h1 className={styles.subtitle}>{subtitle}</h1>
          <p className={styles.tagline}>Anote em segundos. Saiba quanto sobra.</p>
        </div>

        <div className={styles.card}>{children}</div>

        {footer && <p className={styles.switch}>{footer}</p>}
      </div>
    </main>
  );
}
