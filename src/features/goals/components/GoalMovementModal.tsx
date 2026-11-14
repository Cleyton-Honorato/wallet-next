'use client';

import { useId, useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate, formatDateForInput } from '@/lib/format';
import type { GoalDto, GoalMovementType } from '@/lib/types';
import { addGoalMovementAction } from '@/server/actions/goals';
import styles from './Goals.module.css';

const TIPOS = [
  { value: 'DEPOSIT', label: 'Guardar' },
  { value: 'WITHDRAWAL', label: 'Resgatar' },
];

export function GoalMovementModal({
  goal,
  onClose,
}: {
  goal: GoalDto;
  onClose: () => void;
}) {
  const fieldId = useId();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<GoalMovementType>('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => formatDateForInput(new Date()));
  const [description, setDescription] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;

    setError(null);
    startTransition(async () => {
      const result = await addGoalMovementAction({
        id: goal.id,
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
    <Modal
      title={goal.name}
      subtitle="Registre quanto está guardando ou resgatando desta meta."
      onClose={onClose}
    >
      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Já guardado</span>
          <span className={styles.summaryValue}>
            {formatCurrency(goal.balance)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>
            {goal.completed ? 'Meta atingida' : 'Falta juntar'}
          </span>
          <span className={styles.summaryValue}>
            {formatCurrency(goal.remaining)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.fields}>
          <div className={styles.row}>
            <Select
              id={`${fieldId}-type`}
              label="Tipo"
              options={TIPOS}
              value={type}
              onChange={(e) => setType(e.target.value as GoalMovementType)}
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
              required
              autoFocus
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
            placeholder="Ex.: sobra do mês"
          />
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending
              ? 'Registrando…'
              : type === 'DEPOSIT'
                ? 'Guardar'
                : 'Resgatar'}
          </Button>
        </div>
      </form>

      <h4 className={styles.sectionTitle}>Movimentações recentes</h4>
      {goal.movements.length === 0 ? (
        <p className={styles.emptyMovements}>
          Nenhuma movimentação registrada ainda.
        </p>
      ) : (
        <div className={styles.movements}>
          {goal.movements.slice(0, 8).map((movement) => {
            const isDeposit = movement.type === 'DEPOSIT';
            return (
              <div key={movement.id} className={styles.movement}>
                <div className={styles.movementMain}>
                  <span>
                    {movement.description ||
                      (isDeposit ? 'Aporte' : 'Resgate')}
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
      )}
    </Modal>
  );
}
