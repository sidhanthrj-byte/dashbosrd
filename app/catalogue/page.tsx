import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Mono } from 'next/font/google';
import { Catalogue } from '@/components/catalogue/Catalogue';

const serif = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Relive Events — SFX Technical Catalogue',
  description:
    'Special effects systems for event planners and producers — cold spark, cryogenic CO₂, confetti, flame and atmospheric. Specifications, applications and planning notes for fourteen crewed systems.',
};

export default function CataloguePage() {
  return (
    <div className={`${serif.variable} ${mono.variable}`}>
      <Catalogue />
    </div>
  );
}
