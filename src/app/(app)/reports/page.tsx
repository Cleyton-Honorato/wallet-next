import type { Metadata } from 'next';
import { BarChart3 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export const metadata: Metadata = { title: 'Relatórios — Wallet' };

export default function ReportsPage() {
  return (
    <PageContainer>
      <PlaceholderPage
        icon={BarChart3}
        title="Relatórios"
        subtitle="Análises e gráficos detalhados"
      />
    </PageContainer>
  );
}
