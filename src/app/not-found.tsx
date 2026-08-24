import Link from 'next/link';
import { Compass } from 'lucide-react';
import styles from '@/components/ui/Feedback.module.css';

export default function NotFound() {
  return (
    <div className={`${styles.center} ${styles.fullscreen}`}>
      <Compass size={44} />
      <h2 className={styles.title}>Página não encontrada</h2>
      <p className={styles.text}>
        O endereço acessado não existe no Wallet.
      </p>
      <Link href="/">Voltar ao dashboard</Link>
    </div>
  );
}
