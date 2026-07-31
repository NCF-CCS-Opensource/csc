import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import {
  deleteEvent,
  EventLifecycleError,
  parseEventInput,
  updateEvent,
} from "@/lib/events";

function lifecycleError(error: EventLifecycleError) {
  return NextResponse.json(
    { error: error.message },
    { status: error.message === "Event not found" ? 404 : 422 },
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;

  const { id } = await params;
  try {
    return NextResponse.json({
      event: await updateEvent(
        authorization.actor,
        id,
        parseEventInput(await request.json()),
      ),
    });
  } catch (error) {
    if (error instanceof EventLifecycleError) return lifecycleError(error);
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;

  const { id } = await params;
  try {
    await deleteEvent(authorization.actor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof EventLifecycleError) return lifecycleError(error);
    throw error;
  }
}
