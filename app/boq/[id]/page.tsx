import { BOQBuilder } from '@/components/boq/BOQBuilder';

type Props = { params: Promise<{ id: string }> };

export default async function BOQBuilderPage({ params }: Props) {
  const { id } = await params;
  return <BOQBuilder projectId={id} />;
}
