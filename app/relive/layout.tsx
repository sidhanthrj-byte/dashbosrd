import type { Metadata } from 'next';
import { Fraunces } from 'next/font/google';
import './theme.css';

const fraunces = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Relive Control Room',
  description: 'Live operations control room for the event industry — guests, run of show, transport, vendors, cues.',
};

export default function ReliveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`relive ${fraunces.variable} min-h-screen`}>
      {children}
    </div>
  );
}
