'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useModalBehavior } from '@/components/ui/useModalBehavior';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, formatDateForInput } from '@/lib/format';
import type { EmergencyFundDto, EmergencyFundMovementType } from '@/lib/types';
import {
  addEmergencyFundMovementAction,
  updateEmergencyFundAction,
} from '@/server/actions/emergency-fund';
import styles from './EmergencyFundModal.module.css';

const MOVEMENT_OPTIONS = [
  { value: 'DEPOSIT', label: 'Depósito' },
  { value: 'WITHDRAWAL', label: 'Resgate' },
];

export function EmergencyFundModal({
  fund,
  onClose,
}: {
  fund: EmergencyFundDto;
  onClose: () => void;
}) {
  const fieldId = useId();
  useModalBehavior(onClose);

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Rascunho do usuário ou, antes de editar, a meta que veio do servidor.
  const [targetDraft, setTargetDraft] = useState<string | null>(null);
  const target = targetDraft ?? String(fund.targetAmount);

  const [type, setType] = useState<EmergencyFundMovementType>('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => formatDateForInput(new Date()));
  const [description, setDescription] = useState('');

  const handleSaveTarget = (event: FormEvent) => {
    event.preventDefault();
    const targetAmount = Number(target);
    if (!Number.isFinite(targetAmount) || targetAmount < 0) return;

    setError(null);
    startTransition(async () => {
      const result = await updateEmergencyFundAction({ targetAmount });
      if (!result.ok) setError(result.error);
    });
  };

  const handleAddMovement = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;

    setError(null);
    startTransition(async () => {
      const result = await addEmergencyFundMovementAction({
        type,
        amount: value,
        date,
        description: description.trim() || undefined,
      });
      if (result.ok) {
        setAmount('');
        setDescription('');
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fieldId}-title`}
      >
        <h3 id={`${fieldId}-title`} className={styles.title}>
          Reserva de emergência
        </h3>
        <p className={styles.subtitle}>
          Defina sua meta e registre depósitos ou resgates.
        </p>

        {error && <div className={styles.formError}>{error}</div>}

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Saldo atual</span>
            <span className={styles.summaryValue}>
              {formatCurrency(fund.balance)}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Meta</span>
            <span className={styles.summaryValue}>
              {formatCurrency(fund.targetAmount)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveTarget}>
          <h4 className={styles.sectionTitle}>Definir meta</h4>
          <div className={styles.fields}>
            <Input
              id={`${fieldId}-target`}
              label="Meta da reserva (R$)"
              type="number"
              step="0.01"
              min="0"
              value={target}
              onChange={(e) => setTargetDraft(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className={styles.actions}>
            <Button variant="secondary" type="submit" disabled={isPending}>
              {isPending ? 'Salvando…' : 'Salvar meta'}
            </Button>
          </div>
        </form>

        <form onSubmit={handleAddMovement} className={styles.section}>
          <h4 className={styles.sectionTitle}>Nova movimentação</h4>
          <div className={styles.fields}>
            <div className={styles.row}>
              <Select
                id={`${fieldId}-type`}
                label="Tipo"
                options={MOVEMENT_OPTIONS}
                value={type}
                onChange={(e) =>
                  setType(e.target.value as EmergencyFundMovementType)
                }
              />
              <Input
                id={`${fieldId}-amount`}
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <Input
              id={`${fieldId}-date`}
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              id={`${fieldId}-desc`}
              label="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex.: Depósito mensal"
            />
          </div>
          <div className={styles.actions}>
            <Button variant="primary" type="submit" disabled={isPending}>
              {isPending ? 'Registrando…' : 'Registrar'}
            </Button>
          </div>
        </form>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Movimentações recentes</h4>
          {fund.movements.length > 0 ? (
            <div className={styles.movements}>
              {fund.movements.slice(0, 8).map((movement) => {
                const isDeposit = movement.type === 'DEPOSIT';
                return (
                  <div key={movement.id} className={styles.movement}>
                    <div className={styles.movementMain}>
                      <span>
                        {movement.description ||
                          (isDeposit ? 'Depósito' : 'Resgate')}
                      </span>
                      <span className={styles.movementDate}>
                        {formatDate(movement.date)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        styles.movementAmount,
                        isDeposit ? styles.deposit : styles.withdrawal,
                      )}
                    >
                      {isDeposit ? '+' : '−'} {formatCurrency(movement.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={styles.empty}>
              Nenhuma movimentação registrada ainda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
