import type { Metadata } from 'next';
import { Catalogue } from '@/components/catalogue/Catalogue';

export const metadata: Metadata = {
  title: 'Relive Events — SFX Machine Catalogue',
  description:
    'Special effects machines for event planners — cold sparks, cryo CO₂, confetti, flame and atmosphere. Watch every effect come alive and build an enquiry.',
};

export default function CataloguePage() {
  return <Catalogue />;
}
