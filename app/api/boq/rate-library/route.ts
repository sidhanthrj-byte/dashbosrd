import { NextRequest, NextResponse } from 'next/server';
import { RATE_LIBRARY } from '@/lib/boq-data';
import { getAuthUser } from '@/lib/auth';
import { initDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const q = searchParams.get('q')?.toLowerCase();

  let items = RATE_LIBRARY;
  if (category && category !== 'All') {
    items = items.filter(i => i.category === category);
  }
  if (q) {
    items = items.filter(i =>
      i.description.toLowerCase().includes(q) ||
      i.subcategory.toLowerCase().includes(q) ||
      i.specification.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ items });
}
