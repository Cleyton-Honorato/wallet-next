'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Pencil, Plus, ShieldCheck, Target, Trash2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmergencyFundModal } from '@/features/emergency-fund/components/EmergencyFundModal';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { brandTone } from '@/lib/palette';
import { monthsRemaining, suggestedMonthly } from '@/lib/goal-pace';
import { capitalize, formatMonthLabel } from '@/lib/period-label';
import type { EmergencyFundDto, GoalDto } from '@/lib/types';
import { deleteGoalAction } from '@/server/actions/goals';
import { GoalIcon } from '../icon-map';
import { GoalDialog } from './GoalDialog';
import { GoalMovementModal } from './GoalMovementModal';
import styles from './GoalsPage.module.css';

/** "até dezembro 2026 · guarde R$ 750/mês" — o objetivo virando plano. */
function paceLabel(goal: GoalDto): string | null {
  if (!goal.targetDate) return null;

  const prazo = capitalize(formatMonthLabel(goal.targetDate.slice(0, 7)));
  if (goal.completed) return `Concluído · meta era até ${prazo}`;

  const meses = monthsRemaining(goal.targetDate);
  if (meses === 0) return `Prazo encerrado em ${prazo}`;

  const porMes = suggestedMonthly(goal.remaining, meses);
  return `Até ${prazo} · guarde ${formatCurrency(porMes)}/mês`;
}

export function GoalsView({ goals, fund }: { goals: GoalDto[]; fund: EmergencyFundDto }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GoalDto | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // O objetivo em movimentação vem da lista, para refletir o revalidate.
  const movingGoal = goals.find((g) => g.id === movingId) ?? null;

  const totals = {
    saved: goals.reduce((sum, g) => sum + g.balance, 0),
  };

  const handleDelete = (goal: GoalDto) => {
    if (
      !window.confirm(
        `Excluir "${goal.name}"? O histórico desta meta será apagado.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteGoalAction({ id: goal.id });
      if (!result.ok) setError(result.error);
    });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Metas</h1>
          {goals.length > 0 && (
            <p className={styles.subtitle}>
              Guardado nas metas: <strong>{formatCurrency(totals.saved)}</strong>
            </p>
          )}
        </div>
        <Button icon={<Plus size={18} />} onClick={openCreate}>
          Nova meta
        </Button>
      </header>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <section className={styles.reserve} aria-labelledby="reserve-title">
        <div className={styles.reserveHead}>
          <span className={styles.reserveIcon} aria-hidden>
            <ShieldCheck size={22} />
          </span>
          <h2 id="reserve-title" className={styles.reserveTitle}>
            Reserva de emergência
          </h2>
        </div>
        <p className={styles.reserveValue}>
          {formatCurrency(fund.balance)}
          {fund.targetAmount > 0 && (
            <span className={styles.reserveOf}> de {formatCurrency(fund.targetAmount)}</span>
          )}
        </p>
        {fund.targetAmount > 0 && (
          <div className={styles.reserveTrack} aria-hidden>
            <div
              className={styles.reserveFill}
              style={{ width: `${Math.min(100, (fund.balance / fund.targetAmount) * 100)}%` }}
            />
          </div>
        )}
        <p className={styles.reserveHint}>
          {fund.targetAmount > 0
            ? fund.balance >= fund.targetAmount
              ? 'Reserva completa. Você está protegido para imprevistos.'
              : `Faltam ${formatCurrency(fund.targetAmount - fund.balance)} para a reserva ficar completa.`
            : 'Dinheiro para imprevistos. O ideal é guardar de 3 a 6 meses dos seus gastos.'}
        </p>
        <Button size="lg" block onClick={() => setReserveOpen(true)}>
          Guardar ou resgatar
        </Button>
      </section>

      {goals.length === 0 ? (
        <section className={styles.empty}>
          <span className={styles.emptyIcon} aria-hidden>
            <Target size={28} />
          </span>
          <h2 className={styles.emptyTitle}>Para o que você está guardando?</h2>
          <p className={styles.emptyText}>
            Uma viagem, um celular novo, quitar uma dívida. Crie uma meta e
            acompanhe quanto falta.
          </p>
          <Button variant="accent" size="lg" icon={<Plus size={18} />} onClick={openCreate}>
            Criar minha primeira meta
          </Button>
        </section>
      ) : (
        <div className={styles.grid}>
          {goals.map((goal) => {
            const pace = paceLabel(goal);
            const tone = brandTone(goal.color);
            const percent = Math.min(100, Math.floor(goal.usagePercent));
            return (
              <article
                key={goal.id}
                className={cn(styles.card, goal.completed && styles.cardDone)}
              >
                <div className={styles.cardHead}>
                  <span
                    className={styles.goalIcon}
                    style={{ backgroundColor: tone.soft, color: tone.color }}
                    aria-hidden
                  >
                    <GoalIcon name={goal.icon} size={22} color={tone.color} />
                  </span>
                  <span className={styles.cardText}>
                    <span className={styles.goalName}>{goal.name}</span>
                    {goal.completed ? (
                      <span className={styles.done}>
                        <CheckCircle2 size={14} aria-hidden /> Meta atingida
                      </span>
                    ) : (
                      pace && <span className={styles.pace}>{pace}</span>
                    )}
                  </span>
                  <span className={styles.percent}>{percent}%</span>
                </div>

                <div className={styles.track} aria-hidden>
                  <div
                    className={styles.fill}
                    style={{ width: `${percent}%`, background: tone.color }}
                  />
                </div>
                <p className={styles.amounts}>
                  <strong>{formatCurrency(goal.balance)}</strong> de{' '}
                  {formatCurrency(goal.targetAmount)}
                </p>

                <div className={styles.cardActions}>
                  <Button
                    variant="secondary"
                    className={styles.saveBtn}
                    icon={<Wallet size={18} />}
                    onClick={() => setMovingId(goal.id)}
                  >
                    Guardar dinheiro
                  </Button>
                  <button
                    type="button"
                    className={styles.iconAction}
                    onClick={() => {
                      setEditing(goal);
                      setDialogOpen(true);
                    }}
                    aria-label={`Editar ${goal.name}`}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    className={styles.iconAction}
                    onClick={() => handleDelete(goal)}
                    aria-label={`Excluir ${goal.name}`}
                    disabled={isPending}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <GoalDialog
          editing={editing}
          onClose={() => {
            setDialogOpen(false);
            setEditing(null);
          }}
        />
      )}

      {movingGoal && (
        <GoalMovementModal
          goal={movingGoal}
          onClose={() => setMovingId(null)}
        />
      )}

      {reserveOpen && (
        <EmergencyFundModal fund={fund} onClose={() => setReserveOpen(false)} />
      )}
    </div>
  );
}
