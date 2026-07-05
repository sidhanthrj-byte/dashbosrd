import { ControlRoom } from '@/components/relive/ControlRoom';

export default async function EventControlRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ControlRoom eventId={Number(id)} />;
}
