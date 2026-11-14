import { redirect } from 'next/navigation';

/** As quatro telas antigas viraram a lista única de Lançamentos. */
export default async function LegacyEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  redirect(`/transactions?show=in${month ? `&month=${month}` : ''}`);
}
