import { redirect } from 'next/navigation';

export default async function BarrowerDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/borrowers/${id}`);
}
