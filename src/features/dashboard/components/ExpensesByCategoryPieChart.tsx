'use client';

import {
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Panel } from '@/components/ui/Panel';
import { formatCurrency } from '@/lib/format';
import type { ExpenseByCategoryDto } from '@/lib/types';
import styles from './ExpensesByCategoryPieChart.module.css';

/** Quantos anéis concêntricos são renderizados. */
const MAX_RINGS = 6;

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ExpenseByCategoryDto }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className={styles.tooltip}>
      <strong>{item.categoryName}</strong>
      <span>{formatCurrency(item.amount)}</span>
      <span>{item.percentage}%</span>
    </div>
  );
}

export function ExpensesByCategoryPieChart({
  data,
}: {
  data: ExpenseByCategoryDto[];
}) {
  const total = data.reduce((sum, slice) => sum + slice.amount, 0);

  // Maior categoria primeiro — dá o destaque na legenda e no centro.
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  const rings = sorted.slice(0, MAX_RINGS);
  const topSlice = sorted[0];

  // RadialBarChart empilha data[0] no anel mais interno; invertendo, a maior
  // categoria fica no anel externo.
  const chartData = [...rings].reverse();

  return (
    <Panel title="Despesas por categoria">
      {data.length === 0 ? (
        <p className={styles.empty}>Nenhuma despesa no período selecionado.</p>
      ) : (
        <div className={styles.content}>
          <div className={styles.summary}>
            <span className={styles.summaryValue}>{formatCurrency(total)}</span>
            <span className={styles.summaryLabel}>Total gasto</span>
            {topSlice && (
              <span
                className={styles.summaryBadge}
                style={{
                  color: topSlice.color,
                  background: `color-mix(in srgb, ${topSlice.color} 14%, transparent)`,
                }}
              >
                Maior: {topSlice.categoryName} · {topSlice.percentage}%
              </span>
            )}
          </div>

          <div className={styles.dialWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="38%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                barSize={11}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar
                  dataKey="percentage"
                  background={{ className: styles.track }}
                  cornerRadius={10}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.categoryId} fill={entry.color} />
                  ))}
                </RadialBar>
                <Tooltip content={<CustomTooltip />} cursor={false} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <ul className={styles.legend}>
            {rings.map((slice) => (
              <li key={slice.categoryId} className={styles.legendRow}>
                <span
                  className={styles.dot}
                  style={{ background: slice.color }}
                  aria-hidden
                />
                <span className={styles.legendLabel}>{slice.categoryName}</span>
                <span className={styles.legendAmount}>
                  {formatCurrency(slice.amount)}
                </span>
                <span
                  className={styles.legendBadge}
                  style={{
                    color: slice.color,
                    background: `color-mix(in srgb, ${slice.color} 14%, transparent)`,
                  }}
                >
                  {slice.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
