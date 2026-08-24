'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from '@/components/ui/Feedback.module.css';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.center}>
      <AlertTriangle size={44} className={styles.icon} />
      <h2 className={styles.title}>Algo deu errado</h2>
      <p className={styles.text}>
        Não foi possível carregar esta página. Tente novamente; se persistir,
        verifique se o banco de dados está no ar.
      </p>
      <Button variant="primary" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
