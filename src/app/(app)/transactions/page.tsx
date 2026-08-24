import type { Metadata } from 'next';
import { ArrowLeftRight } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export const metadata: Metadata = { title: 'Transações — Wallet' };

export default function TransactionsPage() {
  return (
    <PageContainer>
      <PlaceholderPage
        icon={ArrowLeftRight}
        title="Transações"
        subtitle="Gerencie suas receitas e despesas"
      />
    </PageContainer>
  );
}
