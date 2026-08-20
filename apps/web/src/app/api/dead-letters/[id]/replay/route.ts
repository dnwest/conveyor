import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { serverEnv } from '@/lib/env';

// The browser never holds the service token: the console authorises the
// operator here, server-side, and only then speaks to the API.
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ message: 'Sign in to replay a dead letter' }, { status: 401 });
  }
  if (session.user.role !== 'operator') {
    return NextResponse.json(
      { message: 'Replaying requires an operator account' },
      { status: 403 },
    );
  }

  const { id } = await context.params;
  const env = serverEnv();

  const response = await fetch(`${env.API_URL}/dead-letters/${id}/replay`, {
    method: 'POST',
    headers: { 'x-service-token': env.API_SERVICE_TOKEN },
  });

  return NextResponse.json(await response.json(), { status: response.status });
}
