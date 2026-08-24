import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { CategoriesView } from '@/features/categories/components/CategoriesView';
import { requireUser } from '@/server/auth/session';
import { listCategories } from '@/server/services/categories';

export const metadata: Metadata = { title: 'Categorias — Wallet' };

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await listCategories(user.userId);

  return (
    <PageContainer>
      <CategoriesView categories={categories} />
    </PageContainer>
  );
}
