import Link from 'next/link';
import { AlertCircle, CalendarClock, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { MonthPill } from '@/components/ui/MonthPill';
import { EntryRow } from '@/features/entries/components/EntryRow';
import { QuickAdd } from '@/features/quick-add/QuickAdd';
import { formatCurrency, formatDate } from '@/lib/format';
import { formatMonthKeyLabel, getCurrentMonthKey } from '@/lib/month';
import { byMostRecent } from '@/lib/month-entry';
import { brandTone } from '@/lib/palette';
import type {
  CategoryDto,
  DashboardSummaryDto,
  EmergencyFundDto,
  MonthEntryDto,
  OverdueSummaryDto,
} from '@/lib/types';
import styles from './Home.module.css';

interface HomeViewProps {
  userName: string;
  monthKey: string;
  summary: DashboardSummaryDto;
  overdue: OverdueSummaryDto;
  fund: EmergencyFundDto;
  entries: MonthEntryDto[];
  categories: CategoryDto[];
}

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function splitCents(value: number): [string, string] {
  const text = formatCurrency(Math.abs(value));
  const comma = text.lastIndexOf(',');
  return [text.slice(0, comma), text.slice(comma)];
}

/**
 * Início: uma pergunta respondida (quanto sobrou), duas ações enormes
 * (Gastei / Recebi) e só o que pede atenção agora.
 */
export function HomeView({
  userName,
  monthKey,
  summary,
  overdue,
  fund,
  entries,
  categories,
}: HomeViewProps) {
  const firstName = userName.split(' ')[0];
  const monthName = formatMonthKeyLabel(monthKey).split(' ')[0];
  const isCurrentMonth = monthKey === getCurrentMonthKey();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const income = summary.income.total;
  const spent = summary.expenses.total;
  const balance = summary.balance;
  const [whole, cents] = splitCents(balance);
  const spentPercent = income > 0 ? Math.min(100, Math.round((spent / income) * 100)) : spent > 0 ? 100 : 0;

  const recent = [...entries].sort(byMostRecent).slice(0, 5);
  const topCategories = summary.expensesByCategory.slice(0, 4);
  const maxCategory = topCategories[0]?.amount ?? 0;
  const goals = summary.goals.items.slice(0, 2);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.hello}>
          <span className={styles.helloSmall}>{greeting(new Date())},</span>
          <h1 className={styles.helloName}>{firstName}</h1>
        </div>
        <MonthPill monthKey={monthKey} />
      </header>

      <div className={styles.grid}>
        <div className={styles.colMain}>
          <section className={styles.hero} aria-label="Resumo do mês">
            <span className={styles.heroLabel}>
              {balance >= 0 ? 'Sobrou' : 'Faltou'} em {monthName}
            </span>
            <p className={styles.heroValue}>
              {balance < 0 && '− '}
              {whole}
              <span className={styles.heroCents}>{cents}</span>
            </p>
            <div
              className={styles.bar}
              role="meter"
              aria-label="Quanto do que entrou já foi gasto"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={spentPercent}
            >
              <div
                className={styles.barFill}
                data-over={spent > income}
                style={{ width: `${spentPercent}%` }}
              />
            </div>
            <div className={styles.heroFoot}>
              <span>Gastou {formatCurrency(spent)}</span>
              <span>Entrou {formatCurrency(income)}</span>
            </div>
          </section>

          <QuickAdd trigger="hero" categories={categories} monthKey={monthKey} />

          {overdue.count > 0 ? (
            <Link href="/transactions?show=pending" className={`${styles.notice} ${styles.noticeAlert}`}>
              <span className={styles.noticeIcon} aria-hidden>
                <AlertCircle size={22} />
              </span>
              <span className={styles.noticeText}>
                <span className={styles.noticeTitle}>
                  {overdue.count === 1 ? '1 conta vencida' : `${overdue.count} contas vencidas`}
                </span>
                <span className={styles.noticeSub}>
                  {overdue.items
                    .slice(0, 2)
                    .map((b) => b.title)
                    .join(', ')}
                  {overdue.count > 2 && '…'} · {formatCurrency(overdue.total)}
                </span>
              </span>
              <span className={styles.noticeCta}>
                Resolver <ChevronRight size={18} aria-hidden />
              </span>
            </Link>
          ) : overdue.next ? (
            <Link href="/transactions?show=pending" className={styles.notice}>
              <span className={styles.noticeIcon} aria-hidden>
                <CalendarClock size={22} />
              </span>
              <span className={styles.noticeText}>
                <span className={styles.noticeTitle}>
                  {overdue.next.title}{' '}
                  {overdue.next.daysUntil === 0
                    ? 'vence hoje'
                    : overdue.next.daysUntil === 1
                      ? 'vence amanhã'
                      : `vence em ${overdue.next.daysUntil} dias`}
                </span>
                <span className={styles.noticeSub}>
                  {formatDate(overdue.next.dueDate, "dd 'de' MMMM")} ·{' '}
                  {formatCurrency(overdue.next.amount)}
                </span>
              </span>
              <ChevronRight size={20} aria-hidden className={styles.noticeChevron} />
            </Link>
          ) : null}

          {(fund.targetAmount > 0 || goals.length > 0) && (
            <Link href="/goals" className={styles.savings}>
              <span className={styles.savingsHead}>
                <span className={styles.savingsTitle}>
                  <ShieldCheck size={20} aria-hidden /> Seu dinheiro guardado
                </span>
                <ChevronRight size={20} aria-hidden />
              </span>
              {fund.targetAmount > 0 && (
                <span className={styles.savingsRow}>
                  <span className={styles.savingsName}>Reserva de emergência</span>
                  <span className={styles.savingsTrack} aria-hidden>
                    <span
                      className={styles.savingsFill}
                      style={{
                        width: `${Math.min(100, (fund.balance / fund.targetAmount) * 100)}%`,
                      }}
                    />
                  </span>
                  <span className={styles.savingsValue}>{formatCurrency(fund.balance)}</span>
                  <span className={styles.savingsOf}>
                    de {formatCurrency(fund.targetAmount)} ·{' '}
                    {Math.floor((fund.balance / fund.targetAmount) * 100)}%
                  </span>
                </span>
              )}
              {goals.map((g) => (
                <span key={g.id} className={styles.savingsRow}>
                  <span className={styles.savingsName}>{g.name}</span>
                  <span className={styles.savingsTrack} aria-hidden>
                    <span
                      className={styles.savingsFill}
                      style={{
                        width: `${Math.min(100, g.usagePercent)}%`,
                        background: brandTone(g.color).color,
                      }}
                    />
                  </span>
                  <span className={styles.savingsValue}>{formatCurrency(g.balance)}</span>
                  <span className={styles.savingsOf}>
                    de {formatCurrency(g.targetAmount)} · {Math.floor(g.usagePercent)}%
                  </span>
                </span>
              ))}
            </Link>
          )}
        </div>

        <div className={styles.colSide}>
          {entries.length === 0 ? (
            <section className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden>
                <Sparkles size={26} />
              </span>
              <h2 className={styles.emptyTitle}>
                {isCurrentMonth ? 'Seu mês está em branco' : `Nada anotado em ${monthName}`}
              </h2>
              <p className={styles.emptyText}>
                Toque em <strong>Gastei</strong> sempre que pagar algo. Leva 5
                segundos, e no fim do mês você sabe exatamente para onde foi
                o dinheiro.
              </p>
            </section>
          ) : (
            <>
              {topCategories.length > 0 && (
                <section className={styles.card} aria-labelledby="where-title">
                  <h2 id="where-title" className={styles.cardTitle}>
                    Para onde foi o dinheiro
                  </h2>
                  <ul className={styles.cats}>
                    {topCategories.map((c) => (
                      <li key={c.categoryId} className={styles.catRow}>
                        <span className={styles.catName}>{c.categoryName}</span>
                        <span className={styles.catTrack} aria-hidden>
                          <span
                            className={styles.catFill}
                            style={{
                              width: `${maxCategory > 0 ? Math.max(4, (c.amount / maxCategory) * 100) : 0}%`,
                            }}
                          />
                        </span>
                        <span className={styles.catValue}>{formatCurrency(c.amount)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className={styles.card} aria-labelledby="recent-title">
                <div className={styles.cardHead}>
                  <h2 id="recent-title" className={styles.cardTitle}>
                    Últimos lançamentos
                  </h2>
                  <Link href={`/transactions?month=${monthKey}`} className={styles.cardLink}>
                    Ver tudo
                  </Link>
                </div>
                <ul className={styles.list}>
                  {recent.map((item) => {
                    const category = categoryMap.get(item.entry.categoryId);
                    return (
                      <EntryRow
                        key={item.key}
                        item={item}
                        category={category}
                        meta={`${category?.name ?? 'Sem categoria'}${item.source === 'fixed' ? ' · todo mês' : ''}`}
                      />
                    );
                  })}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
