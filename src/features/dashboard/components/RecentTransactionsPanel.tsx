'use client';

import { Receipt } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import styles from './RecentTransactionsPanel.module.css';

/**
 * O resumo ainda não expõe um feed de transações, então o painel mostra um
 * estado vazio desenhado até que essa fonte de dados exista.
 */
export function RecentTransactionsPanel({
  onNewTransaction,
}: {
  onNewTransaction: () => void;
}) {
  const router = useRouter();

  return (
    <Panel
      title="Transações recentes"
      action={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/transactions')}
        >
          Ver todas
        </Button>
      }
    >
      <div className={styles.empty}>
        <span className={styles.iconCircle}>
          <Receipt size={24} />
        </span>
        <p className={styles.title}>Sem lançamentos recentes</p>
        <p className={styles.text}>
          As últimas receitas e despesas do período aparecerão aqui assim que
          forem registradas.
        </p>
        <Button variant="secondary" size="sm" onClick={onNewTransaction}>
          Nova transação
        </Button>
      </div>
    </Panel>
  );
}
