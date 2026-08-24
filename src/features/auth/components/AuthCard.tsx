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
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Image src="/logo.png" alt="" width={40} height={40} priority />
          <span className={styles.brandText}>Wallet</span>
        </div>
        <p className={styles.subtitle}>{subtitle}</p>
        {children}
        {footer && <p className={styles.switch}>{footer}</p>}
      </div>
    </div>
  );
}
