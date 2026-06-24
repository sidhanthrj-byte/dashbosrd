'use client';
import { STATUS_CONFIG } from '@/lib/next-steps';

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  );
}
