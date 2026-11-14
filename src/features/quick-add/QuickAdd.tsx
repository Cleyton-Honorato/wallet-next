'use client';

import { useEffect, useState } from 'react';
import { Check, Minus, Plus } from 'lucide-react';
import type { CategoryDto, EntryKind } from '@/lib/types';
import { QuickAddSheet } from './QuickAddSheet';
import styles from './QuickAdd.module.css';

interface QuickAddProps {
  categories: CategoryDto[];
  monthKey: string;
  /**
   * `hero`: os dois botões grandes Gastei/Recebi do Início.
   * `fab`: um botão flutuante "Anotar" nas listas.
   */
  trigger: 'hero' | 'fab';
}

/** Gatilho + gaveta de lançamento + aviso de "anotado". */
export function QuickAdd({ categories, monthKey, trigger }: QuickAddProps) {
  const [openKind, setOpenKind] = useState<EntryKind | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {trigger === 'hero' ? (
        <div className={styles.heroActions}>
          <button
            type="button"
            className={`${styles.bigBtn} ${styles.bigBtnOut}`}
            onClick={() => setOpenKind('expense')}
          >
            <span className={styles.bigBtnIcon} aria-hidden>
              <Minus size={20} strokeWidth={2.6} />
            </span>
            Gastei
          </button>
          <button
            type="button"
            className={`${styles.bigBtn} ${styles.bigBtnIn}`}
            onClick={() => setOpenKind('income')}
          >
            <span className={styles.bigBtnIcon} aria-hidden>
              <Plus size={20} strokeWidth={2.6} />
            </span>
            Recebi
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setOpenKind('expense')}
        >
          <Plus size={22} strokeWidth={2.6} aria-hidden />
          Anotar
        </button>
      )}

      {openKind && (
        <QuickAddSheet
          initialKind={openKind}
          categories={categories}
          monthKey={monthKey}
          onClose={() => setOpenKind(null)}
          onSaved={setToast}
        />
      )}

      {toast && (
        <div className={styles.toast} role="status">
          <span className={styles.toastCheck} aria-hidden>
            <Check size={16} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}
    </>
  );
}
