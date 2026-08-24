import type { EntryKind } from '@/lib/types';

/**
 * O domínio é simétrico entre despesa e receita; só o vocabulário muda.
 * Centralizar os textos aqui é o que permite uma única UI para as 4 telas.
 */
interface EntryLabels {
  /** Título da página para a variante fixa e a variável. */
  fixedTitle: string;
  variableTitle: string;
  fixedSubtitle: string;
  variableSubtitle: string;
  newAction: string;
  /** Dia de vencimento (despesa) ou de recebimento (receita). */
  dayLabel: string;
  /** Verbo de quitação: "Pagar" / "Receber". */
  settleAction: string;
  settledStatus: string;
  pendingStatus: string;
  settledCountLabel: string;
  amountPaidLabel: string;
  markAsSettled: string;
  fixedModalTitleNew: string;
  fixedModalTitleEdit: string;
  variableModalTitleNew: string;
  variableModalTitleEdit: string;
  modalSubtitle: string;
  submitNew: string;
  emptyFixed: string;
  emptyVariable: string;
  noCategories: string;
  fixedPanelTitle: string;
  variablePanelTitle: string;
  totalLabel: string;
  activeLabel: string;
}

export const ENTRY_LABELS: Record<EntryKind, EntryLabels> = {
  expense: {
    fixedTitle: 'Despesas Fixas',
    variableTitle: 'Despesas Variáveis',
    fixedSubtitle: 'Gastos recorrentes que se repetem todo mês',
    variableSubtitle: 'Gastos pontuais que mudam de valor a cada mês',
    newAction: 'Nova despesa',
    dayLabel: 'Dia de vencimento',
    settleAction: 'Pagar',
    settledStatus: 'Paga no mês',
    pendingStatus: 'Pendente',
    settledCountLabel: 'Pagas no mês',
    amountPaidLabel: 'Valor pago (R$)',
    markAsSettled: 'Marcar como paga',
    fixedModalTitleNew: 'Nova despesa fixa',
    fixedModalTitleEdit: 'Editar despesa fixa',
    variableModalTitleNew: 'Nova despesa variável',
    variableModalTitleEdit: 'Editar despesa variável',
    modalSubtitle: 'Informe os dados do gasto.',
    submitNew: 'Criar despesa',
    emptyFixed:
      'Nenhuma despesa fixa cadastrada. Clique em "Nova despesa" para começar.',
    emptyVariable: 'Nenhuma despesa variável neste mês.',
    noCategories: 'Cadastre categorias de despesa antes de criar lançamentos.',
    fixedPanelTitle: 'Suas despesas fixas',
    variablePanelTitle: 'Despesas do mês',
    totalLabel: 'Total mensal (ativas)',
    activeLabel: 'Despesas ativas',
  },
  income: {
    fixedTitle: 'Receitas Fixas',
    variableTitle: 'Receitas Variáveis',
    fixedSubtitle: 'Ganhos recorrentes que se repetem todo mês',
    variableSubtitle: 'Ganhos pontuais que mudam de valor a cada mês',
    newAction: 'Nova receita',
    dayLabel: 'Dia de recebimento',
    settleAction: 'Receber',
    settledStatus: 'Recebida no mês',
    pendingStatus: 'Pendente',
    settledCountLabel: 'Recebidas no mês',
    amountPaidLabel: 'Valor recebido (R$)',
    markAsSettled: 'Marcar como recebida',
    fixedModalTitleNew: 'Nova receita fixa',
    fixedModalTitleEdit: 'Editar receita fixa',
    variableModalTitleNew: 'Nova receita variável',
    variableModalTitleEdit: 'Editar receita variável',
    modalSubtitle: 'Informe os dados do ganho.',
    submitNew: 'Criar receita',
    emptyFixed:
      'Nenhuma receita fixa cadastrada. Clique em "Nova receita" para começar.',
    emptyVariable: 'Nenhuma receita variável neste mês.',
    noCategories: 'Cadastre categorias de receita antes de criar lançamentos.',
    fixedPanelTitle: 'Suas receitas fixas',
    variablePanelTitle: 'Receitas do mês',
    totalLabel: 'Total mensal (ativas)',
    activeLabel: 'Receitas ativas',
  },
};
