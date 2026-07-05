import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import { Catalogue } from '@/components/catalogue/Catalogue';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Relive Events — SFX Machine Catalogue',
  description:
    'Special effects machines for event planners — cold sparks, cryo CO₂, confetti, flame and atmosphere. Watch every effect come alive and build an enquiry.',
};

export default function CataloguePage() {
  return (
    <div className={display.variable}>
      <Catalogue />
    </div>
  );
}
