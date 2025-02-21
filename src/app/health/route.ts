import { NextResponse } from 'next/server';

// Healthcheck for Railway (see railway.json).
export async function GET() {
  return NextResponse.json({ health: 'ok' }, { status: 200 });
}
