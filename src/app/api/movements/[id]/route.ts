import type { NextRequest } from 'next/server';

import { movementCommandController } from '@/infrastructure/adapters/input/rest/controller/MovementCommandController';
import { movementQueryController } from '@/infrastructure/adapters/input/rest/controller/MovementQueryController';

export const dynamic = 'force-dynamic';

interface RouteContext {
  readonly params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return movementQueryController.getMovementById(id);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return movementCommandController.update(request, id);
}

/** Same behaviour as PATCH: fields that are not sent stay as they are. */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return movementCommandController.update(request, id);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return movementCommandController.delete(id);
}
