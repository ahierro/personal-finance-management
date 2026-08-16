import type { NextRequest } from 'next/server';

import { movementCommandController } from '@/infrastructure/adapters/input/rest/controller/MovementCommandController';
import { movementQueryController } from '@/infrastructure/adapters/input/rest/controller/MovementQueryController';

// The route handler is only the Next.js socket: the logic lives in the controller.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return movementQueryController.getMovementsPage(request);
}

export async function POST(request: NextRequest) {
  return movementCommandController.create(request);
}
