import { redirect } from 'next/navigation';

/** Relatórios nunca saiu do placeholder; o resumo do mês vive no Início. */
export default function ReportsPage() {
  redirect('/');
}
